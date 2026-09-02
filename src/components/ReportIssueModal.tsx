'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User as FirebaseUser } from 'firebase/auth';
import {
  AlertTriangle,
  X,
  Send,
  Upload,
  CheckCircle2,
  Copy,
  Check,
  Trash2,
  Eye,
  Laptop,
  Scissors,
  FileImage
} from 'lucide-react';
import {
  submitIssueReport,
  getClientTelemetry,
  getRecentClientErrors,
  IssueReport
} from '../lib/report-service';
import { uploadImageAsset } from '../lib/uploadService';

interface ReportIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: FirebaseUser | null;
  activeTab: string;
  isVipActive?: boolean;
}

export const ReportIssueModal: React.FC<ReportIssueModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  activeTab,
  isVipActive = false
}) => {
  const [category, setCategory] = useState<IssueReport['category']>('bug');
  const [severity, setSeverity] = useState<IssueReport['severity']>('medium');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [stepsToReproduce, setStepsToReproduce] = useState<string>('');
  const [reporterName, setReporterName] = useState<string>('');
  const [reporterEmail, setReporterEmail] = useState<string>('');

  // Screenshot states
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [screenshotFileName, setScreenshotFileName] = useState<string>('');
  const [isPreviewZoomOpen, setIsPreviewZoomOpen] = useState<boolean>(false);
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);

  // In-Modal Precision Image Crop Editor states
  const [isCropEditorOpen, setIsCropEditorOpen] = useState<boolean>(false);
  const [cropEditorImage, setCropEditorImage] = useState<string | null>(null);
  const [imageCropBox, setImageCropBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [isCropDragActive, setIsCropDragActive] = useState<boolean>(false);
  const [cropDragStart, setCropDragStart] = useState<{ x: number; y: number } | null>(null);
  const cropImageRef = useRef<HTMLImageElement>(null);
  const cropContainerRef = useRef<HTMLDivElement>(null);

  // Submission states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedReport, setSubmittedReport] = useState<IssueReport | null>(null);
  const [hasCopiedRef, setHasCopiedRef] = useState<boolean>(false);
  const [showTelemetryDetails, setShowTelemetryDetails] = useState<boolean>(false);

  // Front-end Validation States
  const [validationErrors, setValidationErrors] = useState<{
    title?: string;
    description?: string;
    reporterName?: string;
    reporterEmail?: string;
    form?: string;
  }>({});
  const [touched, setTouched] = useState<{
    title?: boolean;
    description?: boolean;
    reporterName?: boolean;
    reporterEmail?: boolean;
  }>({});
  const [submitErrorNotice, setSubmitErrorNotice] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalContainerRef = useRef<HTMLDivElement>(null);

  // Validation function
  const validateInputs = (
    currentTitle = title,
    currentDesc = description,
    currentName = reporterName,
    currentEmail = reporterEmail
  ) => {
    const errors: {
      title?: string;
      description?: string;
      reporterName?: string;
      reporterEmail?: string;
    } = {};

    const t = currentTitle.trim();
    if (!t) {
      errors.title = 'Issue summary / title is required.';
    } else if (t.length < 4) {
      errors.title = `Title must be at least 4 characters long (currently ${t.length}).`;
    } else if (t.length > 120) {
      errors.title = 'Title cannot exceed 120 characters.';
    }

    const d = currentDesc.trim();
    if (!d) {
      errors.description = 'Detailed description is required.';
    } else if (d.length < 15) {
      errors.description = `Please provide more detail (at least 15 characters, currently ${d.length}).`;
    } else if (d.length > 3000) {
      errors.description = 'Description cannot exceed 3000 characters.';
    }

    const n = currentName.trim();
    if (!n) {
      errors.reporterName = 'GamerTag / Name is required.';
    } else if (n.length < 2) {
      errors.reporterName = 'Name must be at least 2 characters.';
    }

    const e = currentEmail.trim();
    if (e) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(e)) {
        errors.reporterEmail = 'Please enter a valid email format (e.g. name@domain.com).';
      }
    }

    return errors;
  };

  // Initialize reporter info from auth user
  useEffect(() => {
    if (currentUser) {
      setReporterName(currentUser.displayName || currentUser.email?.split('@')[0] || 'ViceCityPlayer');
      setReporterEmail(currentUser.email || '');
    } else {
      setReporterName('Guest Player');
      setReporterEmail('');
    }
  }, [currentUser]);

  // Listen to clipboard paste (Ctrl+V) for instant image attach
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            processImageFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  // Listen to keyboard Escape key to close modal or lightbox preview
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isPreviewZoomOpen) {
          e.stopPropagation();
          setIsPreviewZoomOpen(false);
        } else if (isCropEditorOpen) {
          e.stopPropagation();
          setIsCropEditorOpen(false);
          setImageCropBox(null);
        } else {
          handleResetAndClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isCropEditorOpen, isPreviewZoomOpen]);

  // Global mouse event listeners for precision crop dragging across entire window
  useEffect(() => {
    if (!isCropDragActive) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!cropImageRef.current || !cropDragStart) return;
      const rect = cropImageRef.current.getBoundingClientRect();
      const currentX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const currentY = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

      const x = Math.min(cropDragStart.x, currentX);
      const y = Math.min(cropDragStart.y, currentY);
      const width = Math.abs(currentX - cropDragStart.x);
      const height = Math.abs(currentY - cropDragStart.y);

      setImageCropBox({ x, y, width, height });
    };

    const handleGlobalMouseUp = () => {
      setIsCropDragActive(false);
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isCropDragActive, cropDragStart]);

  // Helper to upload image file to UploadThing CDN (No base64 data URLs)
  const processImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, WebP, or GIF).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      alert('Image is too large. Please select an image under 8MB.');
      return;
    }

    try {
      const cdnUrl = await uploadImageAsset(file, 'reportScreenshot');
      setScreenshotUrl(cdnUrl);
      setScreenshotFileName(file.name || 'uploaded_screenshot.png');
    } catch (err: any) {
      alert(`Screenshot upload failed: ${err?.message || 'Network error'}`);
    }
  };

  // In-Modal Image Crop Apply handler
  const handleApplyImageCrop = () => {
    if (!cropEditorImage || !imageCropBox || !cropImageRef.current) {
      setIsCropEditorOpen(false);
      return;
    }

    const imgElem = cropImageRef.current;
    const naturalW = imgElem.naturalWidth;
    const naturalH = imgElem.naturalHeight;
    const displayedW = imgElem.width || imgElem.clientWidth;
    const displayedH = imgElem.height || imgElem.clientHeight;

    if (displayedW <= 0 || displayedH <= 0 || naturalW <= 0 || naturalH <= 0) {
      setIsCropEditorOpen(false);
      return;
    }

    const scaleX = naturalW / displayedW;
    const scaleY = naturalH / displayedH;

    const realX = Math.max(0, Math.round(imageCropBox.x * scaleX));
    const realY = Math.max(0, Math.round(imageCropBox.y * scaleY));
    const realW = Math.min(naturalW - realX, Math.round(imageCropBox.width * scaleX));
    const realH = Math.min(naturalH - realY, Math.round(imageCropBox.height * scaleY));

    if (realW < 10 || realH < 10) {
      setIsCropEditorOpen(false);
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = realW;
    canvas.height = realH;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const originalImg = new Image();
      originalImg.crossOrigin = 'anonymous';
      originalImg.onload = () => {
        ctx.drawImage(originalImg, realX, realY, realW, realH, 0, 0, realW, realH);
        canvas.toBlob(async (blob) => {
          if (blob) {
            try {
              const croppedFile = new File([blob], `cropped_${Date.now()}.jpg`, { type: 'image/jpeg' });
              const cdnUrl = await uploadImageAsset(croppedFile, 'reportScreenshot');
              setScreenshotUrl(cdnUrl);
              setScreenshotFileName(`trimmed_crop_${realW}x${realH}_${Date.now()}.jpg`);
            } catch {
              const fallbackUrl = canvas.toDataURL('image/jpeg', 0.85);
              setScreenshotUrl(fallbackUrl);
            }
          }
          setIsCropEditorOpen(false);
          setImageCropBox(null);
        }, 'image/jpeg', 0.90);
      };
      originalImg.src = cropEditorImage;
    }
  };

  const telemetry = getClientTelemetry(activeTab);
  const consoleErrors = getRecentClientErrors();

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all relevant fields as touched
    setTouched({
      title: true,
      description: true,
      reporterName: true,
      reporterEmail: true
    });

    const errors = validateInputs(title, description, reporterName, reporterEmail);
    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      const firstError = Object.values(errors)[0];
      setSubmitErrorNotice(`Please fix the validation errors: ${firstError}`);
      // Scroll to top of modal container
      if (modalContainerRef.current) {
        modalContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    setSubmitErrorNotice(null);
    setIsSubmitting(true);
    try {
      const report = await submitIssueReport({
        category,
        severity,
        title: title.trim(),
        description: description.trim(),
        stepsToReproduce: stepsToReproduce.trim() || undefined,
        screenshotUrl: screenshotUrl || undefined,
        screenshotFileName: screenshotFileName || undefined,
        reporterUid: currentUser?.uid,
        reporterName: reporterName.trim() || 'Anonymous Player',
        reporterEmail: reporterEmail.trim() || undefined,
        reporterRole: isVipActive ? 'VIP Member' : currentUser ? 'Registered User' : 'Guest',
        isVip: isVipActive,
        activeTab: telemetry.activeTab,
        currentUrl: telemetry.currentUrl,
        browser: telemetry.browser,
        os: telemetry.os,
        screenResolution: telemetry.screenResolution,
        userAgent: telemetry.userAgent,
        recentConsoleErrors: consoleErrors.length > 0 ? consoleErrors : undefined
      });

      setSubmittedReport(report);
    } catch (err) {
      console.error('Failed to submit issue report:', err);
      setSubmitErrorNotice('Failed to submit report to Firestore. Please check your network and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyRefToken = () => {
    if (submittedReport) {
      navigator.clipboard.writeText(submittedReport.reportRefNumber);
      setHasCopiedRef(true);
      setTimeout(() => setHasCopiedRef(false), 2000);
    }
  };

  const handleResetAndClose = () => {
    setSubmittedReport(null);
    setTitle('');
    setDescription('');
    setStepsToReproduce('');
    setScreenshotUrl(null);
    setScreenshotFileName('');
    setValidationErrors({});
    setTouched({});
    setSubmitErrorNotice(null);
    setIsPreviewZoomOpen(false);
    setIsCropEditorOpen(false);
    onClose();
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            id="report-issue-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                handleResetAndClose();
              }
            }}
            className="report-modal-backdrop fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          >
            <motion.div
              ref={modalContainerRef}
              initial={{ opacity: 0, scale: 0.93, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ 
                type: 'spring', 
                damping: 28, 
                stiffness: 340, 
                mass: 0.85 
              }}
              className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl shadow-rose-950/20 overflow-hidden flex flex-col max-h-[92vh] will-change-transform"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-rose-950/80 via-zinc-900 to-amber-950/60 p-5 border-b border-zinc-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-400">
                    <AlertTriangle className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-black text-white tracking-wide">
                        Report Error or Issue
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                        Staff Direct Queue
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400">
                      Submit bug reports, visual glitches, or suggestions directly to Admin HQ.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs text-zinc-300 custom-scrollbar">
                {submittedReport ? (
                  /* Success View */
                  <div className="text-center py-8 space-y-5 animate-fade-in">
                    <div className="w-16 h-16 bg-emerald-500/20 border-2 border-emerald-500/50 rounded-2xl flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-950/40">
                      <CheckCircle2 className="w-9 h-9" />
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-xl font-black text-white">Issue Report Dispatched!</h4>
                      <p className="text-zinc-400 text-xs max-w-md mx-auto leading-relaxed">
                        Your report has been forwarded directly to our server engineering and admin team. Thank you for keeping GTA VI Central running smoothly!
                      </p>
                    </div>

                    <div className="bg-zinc-900/90 border border-emerald-500/30 p-4 rounded-xl max-w-sm mx-auto space-y-2 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-zinc-400 uppercase font-mono font-bold">Tracking Reference</span>
                        <button
                          type="button"
                          onClick={handleCopyRefToken}
                          className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-bold cursor-pointer"
                        >
                          {hasCopiedRef ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{hasCopiedRef ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <div className="text-base font-mono font-black text-emerald-300 bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 text-center tracking-wider">
                        {submittedReport.reportRefNumber}
                      </div>
                      <div className="text-[10px] text-zinc-500 flex items-center justify-between pt-1">
                        <span>Category: <strong className="text-zinc-300">{submittedReport.category.toUpperCase()}</strong></span>
                        <span>Severity: <strong className="text-rose-300">{submittedReport.severity.toUpperCase()}</strong></span>
                      </div>
                    </div>

                    <div className="pt-3">
                      <button
                        type="button"
                        onClick={handleResetAndClose}
                        className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-lg transition cursor-pointer"
                      >
                        Done & Return to Platform
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Main Form View */
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Error Banner */}
                    {submitErrorNotice && (
                      <div className="p-3 bg-rose-950/40 border border-rose-500/50 rounded-xl flex items-center gap-3 text-rose-300 text-xs animate-fade-in">
                        <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                        <span className="font-semibold">{submitErrorNotice}</span>
                      </div>
                    )}

                    {/* Category & Severity Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Category Selection */}
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                          Issue Category *
                        </label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value as any)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500 transition cursor-pointer"
                        >
                          <option value="bug">🐛 Bug / Feature Broken</option>
                          <option value="ui">🖥️ UI / Visual Glitch / Alignment</option>
                          <option value="performance">⚡ Performance / Lag / Slow Load</option>
                          <option value="radar_sync">📡 Squad Radar / Map GPS Desync</option>
                          <option value="calculator">🔢 Calculator / Handling Math Issue</option>
                          <option value="voice_comms">🎙️ Voice Comms / Stream Audio</option>
                          <option value="billing_vip">💳 VIP Membership / Billing</option>
                          <option value="suggestion">💡 Feature Suggestion / Idea</option>
                          <option value="other">📝 Other General Inquiry</option>
                        </select>
                      </div>

                      {/* Severity Selection */}
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                          Severity Level *
                        </label>
                        <select
                          value={severity}
                          onChange={(e) => setSeverity(e.target.value as any)}
                          className={`w-full bg-zinc-900 border rounded-xl px-3.5 py-2.5 text-xs font-bold focus:outline-none transition cursor-pointer ${
                            severity === 'critical'
                              ? 'border-rose-500 text-rose-300'
                              : severity === 'high'
                              ? 'border-amber-500 text-amber-300'
                              : severity === 'medium'
                              ? 'border-yellow-600 text-yellow-300'
                              : 'border-zinc-800 text-emerald-300'
                          }`}
                        >
                          <option value="low">🟢 Low — Cosmetic or minor typo</option>
                          <option value="medium">🟡 Medium — Minor issue, workaround available</option>
                          <option value="high">🟠 High — Major feature blocked or failing</option>
                          <option value="critical">🔴 Critical — Application crash / data error</option>
                        </select>
                      </div>
                    </div>

                    {/* Title Field */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                          Issue Summary / Title *
                        </label>
                        <span className={`text-[10px] font-mono ${title.length > 120 ? 'text-rose-400 font-bold' : 'text-zinc-500'}`}>
                          {title.length}/120
                        </span>
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="e.g., Squad Radar marker disappears when zooming in past 15x"
                        value={title}
                        onBlur={() => {
                          setTouched((prev) => ({ ...prev, title: true }));
                          setValidationErrors(validateInputs(title, description, reporterName, reporterEmail));
                        }}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTitle(val);
                          if (touched.title) {
                            setValidationErrors(validateInputs(val, description, reporterName, reporterEmail));
                          }
                          if (submitErrorNotice) setSubmitErrorNotice(null);
                        }}
                        className={`w-full bg-zinc-900 border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none transition ${
                          touched.title && validationErrors.title
                            ? 'border-rose-500 ring-1 ring-rose-500/50 bg-rose-950/10'
                            : 'border-zinc-800 focus:border-rose-500'
                        }`}
                      />
                      {touched.title && validationErrors.title && (
                        <p className="text-[11px] text-rose-400 font-medium flex items-center gap-1.5 pt-0.5">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>{validationErrors.title}</span>
                        </p>
                      )}
                    </div>

                    {/* Description Field */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                          Detailed Description *
                        </label>
                        <span className={`text-[10px] font-mono ${description.length < 15 && touched.description ? 'text-rose-400' : 'text-zinc-500'}`}>
                          {description.length}/3000 (min 15)
                        </span>
                      </div>
                      <textarea
                        required
                        rows={3}
                        placeholder="Explain what happened, what you expected to see, and any error messages shown..."
                        value={description}
                        onBlur={() => {
                          setTouched((prev) => ({ ...prev, description: true }));
                          setValidationErrors(validateInputs(title, description, reporterName, reporterEmail));
                        }}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDescription(val);
                          if (touched.description) {
                            setValidationErrors(validateInputs(title, val, reporterName, reporterEmail));
                          }
                          if (submitErrorNotice) setSubmitErrorNotice(null);
                        }}
                        className={`w-full bg-zinc-900 border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none transition resize-none ${
                          touched.description && validationErrors.description
                            ? 'border-rose-500 ring-1 ring-rose-500/50 bg-rose-950/10'
                            : 'border-zinc-800 focus:border-rose-500'
                        }`}
                      />
                      {touched.description && validationErrors.description && (
                        <p className="text-[11px] text-rose-400 font-medium flex items-center gap-1.5 pt-0.5">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>{validationErrors.description}</span>
                        </p>
                      )}
                    </div>

                    {/* Steps to Reproduce (Optional) */}
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                        <span>Steps to Reproduce (Optional)</span>
                        <span className="text-[10px] text-zinc-500 font-normal">Helps us fix it faster</span>
                      </label>
                      <textarea
                        rows={2}
                        placeholder="1. Open Map Tab&#10;2. Create new Squad Party&#10;3. Click on Vice Point waypoint"
                        value={stepsToReproduce}
                        onChange={(e) => setStepsToReproduce(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 transition resize-none font-mono"
                      />
                    </div>

                    {/* 📸 Screenshot & Visual Evidence Section */}
                    <div className="space-y-2 bg-zinc-900/70 border border-zinc-800/90 p-4 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Upload className="w-4 h-4 text-rose-400" />
                          <span className="text-xs font-bold text-white uppercase tracking-wider">
                            Upload Screenshot
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {screenshotUrl ? 'Visual Evidence Attached' : 'PNG, JPG, WebP up to 8MB'}
                        </span>
                      </div>

                      {/* Hidden File Picker Input for both main upload and replace actions */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            processImageFile(e.target.files[0]);
                          }
                          // Reset input value so re-selecting same file triggers onChange
                          e.target.value = '';
                        }}
                      />

                      {screenshotUrl ? (
                        /* Attached Screenshot Preview */
                        <div className="relative bg-zinc-950 border border-zinc-800 rounded-xl p-3 flex flex-col sm:flex-row items-center gap-4">
                          <div
                            onClick={() => setIsPreviewZoomOpen(true)}
                            className="relative w-full sm:w-36 h-24 bg-zinc-900 rounded-lg overflow-hidden border border-zinc-700 cursor-pointer group shrink-0 shadow-md"
                            title="Click to zoom preview"
                          >
                            <img
                              src={screenshotUrl}
                              alt="Screenshot evidence"
                              className="w-full h-full object-cover group-hover:scale-105 transition"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition">
                              <Eye className="w-5 h-5" />
                            </div>
                          </div>

                          <div className="space-y-2 flex-1 min-w-0 w-full text-left">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Visual Evidence Attached</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setScreenshotUrl(null);
                                  setScreenshotFileName('');
                                }}
                                className="text-rose-400 hover:text-rose-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Remove
                              </button>
                            </div>
                            <p className="text-[11px] text-zinc-400 truncate font-mono">
                              {screenshotFileName || 'screenshot_capture.jpg'}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setCropEditorImage(screenshotUrl);
                                  setIsCropEditorOpen(true);
                                  setImageCropBox(null);
                                }}
                                className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-lg text-[11px] font-bold border border-zinc-700 flex items-center gap-1 cursor-pointer transition"
                                title="Open precision crop tool to trim this image"
                              >
                                <Scissors className="w-3 h-3 text-rose-400" />
                                <span>Trim / Crop</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-lg text-[11px] font-bold border border-zinc-700 flex items-center gap-1 cursor-pointer transition"
                                title="Replace attached image with a new file upload"
                              >
                                <Upload className="w-3 h-3 text-emerald-400" />
                                <span>Replace Image</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setIsPreviewZoomOpen(true)}
                                className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-lg text-[11px] font-bold border border-zinc-700 flex items-center gap-1 cursor-pointer transition"
                              >
                                <Eye className="w-3 h-3 text-cyan-400" />
                                <span>Zoom Full Size</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Dedicated Clean Image Upload Zone */
                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            setIsDraggingFile(true);
                          }}
                          onDragLeave={() => setIsDraggingFile(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsDraggingFile(false);
                            if (e.dataTransfer.files?.[0]) {
                              processImageFile(e.dataTransfer.files[0]);
                            }
                          }}
                          onClick={() => fileInputRef.current?.click()}
                          className={`border-2 border-dashed rounded-xl p-6 text-center transition space-y-3 cursor-pointer group ${
                            isDraggingFile
                              ? 'border-rose-500 bg-rose-950/20'
                              : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950/60 hover:bg-zinc-900/60'
                          }`}
                        >
                          <div className="flex flex-col items-center justify-center gap-2.5">
                            <div className="p-3 bg-zinc-900 group-hover:bg-rose-500/10 rounded-2xl border border-zinc-800 group-hover:border-rose-500/30 text-zinc-400 group-hover:text-rose-400 transition shadow-inner">
                              <Upload className="w-6 h-6" />
                            </div>

                            <div className="space-y-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  fileInputRef.current?.click();
                                }}
                                className="px-4 py-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-950/40 inline-flex items-center gap-2 transition cursor-pointer"
                                title="Upload a saved screenshot or visual evidence image from your device"
                              >
                                <Upload className="w-4 h-4 text-white" />
                                <span>Upload Screenshot</span>
                              </button>
                              <p className="text-[11px] text-zinc-400 pt-1">
                                or click / drag & drop image here • Paste with <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-300 font-mono text-[10px]">Ctrl+V</kbd>
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Reporter Contact Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                          Your GamerTag / Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={reporterName}
                          onBlur={() => {
                            setTouched((prev) => ({ ...prev, reporterName: true }));
                            setValidationErrors(validateInputs(title, description, reporterName, reporterEmail));
                          }}
                          onChange={(e) => {
                            const val = e.target.value;
                            setReporterName(val);
                            if (touched.reporterName) {
                              setValidationErrors(validateInputs(title, description, val, reporterEmail));
                            }
                          }}
                          placeholder="ViceCityPlayer"
                          className={`w-full bg-zinc-900 border rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none transition ${
                            touched.reporterName && validationErrors.reporterName
                              ? 'border-rose-500 ring-1 ring-rose-500/50 bg-rose-950/10'
                              : 'border-zinc-800 focus:border-rose-500'
                          }`}
                        />
                        {touched.reporterName && validationErrors.reporterName && (
                          <p className="text-[11px] text-rose-400 font-medium flex items-center gap-1.5 pt-0.5">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>{validationErrors.reporterName}</span>
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                          Contact Email (Optional)
                        </label>
                        <input
                          type="email"
                          value={reporterEmail}
                          onBlur={() => {
                            setTouched((prev) => ({ ...prev, reporterEmail: true }));
                            setValidationErrors(validateInputs(title, description, reporterName, reporterEmail));
                          }}
                          onChange={(e) => {
                            const val = e.target.value;
                            setReporterEmail(val);
                            if (touched.reporterEmail) {
                              setValidationErrors(validateInputs(title, description, reporterName, val));
                            }
                          }}
                          placeholder="player@vicecity.app"
                          className={`w-full bg-zinc-900 border rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none transition ${
                            touched.reporterEmail && validationErrors.reporterEmail
                              ? 'border-rose-500 ring-1 ring-rose-500/50 bg-rose-950/10'
                              : 'border-zinc-800 focus:border-rose-500'
                          }`}
                        />
                        {touched.reporterEmail && validationErrors.reporterEmail && (
                          <p className="text-[11px] text-rose-400 font-medium flex items-center gap-1.5 pt-0.5">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>{validationErrors.reporterEmail}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Automatic Diagnostic Telemetry Banner */}
                    <div className="bg-zinc-950 border border-zinc-850 p-3.5 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-zinc-400">
                          <Laptop className="w-4 h-4 text-cyan-400" />
                          <span className="text-[11px] font-bold uppercase tracking-wider">
                            Auto-Attached System Telemetry
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowTelemetryDetails(!showTelemetryDetails)}
                          className="text-[11px] text-cyan-400 hover:text-cyan-300 font-bold cursor-pointer"
                        >
                          {showTelemetryDetails ? 'Hide Telemetry' : 'View Diagnostics'}
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono text-zinc-400 pt-1">
                        <div>
                          <span className="text-zinc-600 block">Current Route</span>
                          <span className="text-white truncate block">{telemetry.activeTab}</span>
                        </div>
                        <div>
                          <span className="text-zinc-600 block">Browser</span>
                          <span className="text-white truncate block">{telemetry.browser}</span>
                        </div>
                        <div>
                          <span className="text-zinc-600 block">OS</span>
                          <span className="text-white truncate block">{telemetry.os}</span>
                        </div>
                        <div>
                          <span className="text-zinc-600 block">Resolution</span>
                          <span className="text-white truncate block">{telemetry.screenResolution.split(' ')[0]}</span>
                        </div>
                      </div>

                      {showTelemetryDetails && (
                        <div className="pt-2 border-t border-zinc-850 space-y-1.5 text-[10px] font-mono text-zinc-400 animate-fade-in">
                          <p className="break-all text-zinc-500">
                            <strong>Full URL:</strong> {telemetry.currentUrl}
                          </p>
                          <p className="break-all text-zinc-500">
                            <strong>User Agent:</strong> {telemetry.userAgent}
                          </p>
                          {consoleErrors.length > 0 && (
                            <div className="space-y-1">
                              <span className="text-rose-400 font-bold">Recent Runtime Errors Captured:</span>
                              <div className="p-2 bg-rose-950/30 border border-rose-500/20 rounded text-rose-200 max-h-24 overflow-y-auto space-y-1">
                                {consoleErrors.map((err, i) => (
                                  <div key={i}>{err}</div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Form Action Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleResetAndClose}
                        className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs rounded-xl transition border border-zinc-800 cursor-pointer"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-2.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black text-xs rounded-xl shadow-lg shadow-rose-950/50 flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
                      >
                        <Send className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
                        <span>{isSubmitting ? 'Submitting to HQ...' : 'Submit Issue Report'}</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ✂️ In-Modal Precision Image Crop Editor */}
      <AnimatePresence>
        {isCropEditorOpen && cropEditorImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="px-5 py-3.5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/60">
                <div className="flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-rose-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Trim & Crop Screenshot
                  </h3>
                </div>
                <span className="text-xs text-zinc-400 font-mono">
                  Click & drag over the image to define crop boundary
                </span>
              </div>

              {/* Image Canvas Container */}
              <div
                ref={cropContainerRef}
                className="relative flex-1 min-h-[300px] max-h-[60vh] bg-zinc-900/90 flex items-center justify-center p-4 overflow-hidden select-none"
              >
                <div
                  className="relative cursor-crosshair inline-block"
                  onMouseDown={(e) => {
                    if (!cropImageRef.current) return;
                    const rect = cropImageRef.current.getBoundingClientRect();
                    const startX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
                    const startY = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
                    setIsCropDragActive(true);
                    setCropDragStart({ x: startX, y: startY });
                    setImageCropBox({ x: startX, y: startY, width: 0, height: 0 });
                  }}
                >
                  <img
                    ref={cropImageRef}
                    src={cropEditorImage}
                    alt="Crop target"
                    className="max-h-[55vh] max-w-full object-contain pointer-events-none rounded border border-zinc-800"
                    draggable={false}
                  />

                  {/* Active Crop Box Rect */}
                  {imageCropBox && imageCropBox.width > 5 && imageCropBox.height > 5 && (
                    <div
                      className="absolute border-2 border-rose-500 bg-rose-500/15 backdrop-brightness-110 shadow-[0_0_0_9999px_rgba(0,0,0,0.65)] pointer-events-none"
                      style={{
                        left: `${imageCropBox.x}px`,
                        top: `${imageCropBox.y}px`,
                        width: `${imageCropBox.width}px`,
                        height: `${imageCropBox.height}px`
                      }}
                    >
                      {/* Rule of Thirds subtle guide grid */}
                      {imageCropBox.width > 60 && imageCropBox.height > 60 && (
                        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-25">
                          <div className="border-r border-b border-rose-300/40" />
                          <div className="border-r border-b border-rose-300/40" />
                          <div className="border-b border-rose-300/40" />
                          <div className="border-r border-b border-rose-300/40" />
                          <div className="border-r border-b border-rose-300/40" />
                          <div className="border-b border-rose-300/40" />
                          <div className="border-r border-rose-300/40" />
                          <div className="border-r border-rose-300/40" />
                          <div />
                        </div>
                      )}

                      {/* Corner Grab Handles */}
                      <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-rose-500 border border-white rounded-xs shadow" />
                      <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-rose-500 border border-white rounded-xs shadow" />
                      <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-rose-500 border border-white rounded-xs shadow" />
                      <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-rose-500 border border-white rounded-xs shadow" />

                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-zinc-950/90 text-rose-300 border border-rose-500/60 px-2 py-0.5 rounded text-[10px] font-mono shadow-md whitespace-nowrap">
                        {Math.round(imageCropBox.width)} × {Math.round(imageCropBox.height)} px
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer controls */}
              <div className="px-5 py-3.5 border-t border-zinc-800/80 flex items-center justify-between bg-zinc-900/60">
                <button
                  type="button"
                  onClick={() => {
                    setIsCropEditorOpen(false);
                    setImageCropBox(null);
                  }}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (cropImageRef.current) {
                        setImageCropBox({
                          x: 0,
                          y: 0,
                          width: cropImageRef.current.clientWidth,
                          height: cropImageRef.current.clientHeight
                        });
                      }
                    }}
                    className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyImageCrop}
                    disabled={!imageCropBox || imageCropBox.width < 10 || imageCropBox.height < 10}
                    className="px-5 py-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer disabled:opacity-40"
                  >
                    Apply Crop
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full-Screen Screenshot Lightbox Preview Modal */}
      <AnimatePresence mode="wait">
        {isPreviewZoomOpen && screenshotUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => {
              e.stopPropagation();
              setIsPreviewZoomOpen(false);
            }}
            className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl border border-zinc-800 shadow-2xl"
            >
              <img
                src={screenshotUrl}
                alt="Screenshot Full Resolution"
                className="max-w-full max-h-[85vh] object-contain mx-auto"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPreviewZoomOpen(false);
                }}
                className="absolute top-3 right-3 bg-zinc-950/80 hover:bg-zinc-900 text-zinc-300 hover:text-white px-3 py-1 rounded-full text-xs font-mono border border-zinc-700 cursor-pointer"
              >
                Close (ESC)
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
