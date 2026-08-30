import React, { useState, useEffect } from 'react';
import { Link2, Save, RefreshCw, ExternalLink, Check, AlertCircle, Plus, Eye, Tag, Globe, Sparkles, DollarSign, ToggleLeft, ToggleRight } from 'lucide-react';
import { AffiliatePartner, AFFILIATE_PARTNERS_LIST, getAffiliateRedirectUrl } from '../../lib/affiliate-config';
import { getActiveAffiliatePartners, updateAffiliatePartner, initializeAffiliatesStore } from '../../lib/affiliateStore';
import { logStaffActivity } from '../../lib/staffAuditLogger';

interface AffiliateAdminCmsProps {
  currentAdminGamerTag?: string;
  adminClearanceLevel?: string;
}

export const AffiliateAdminCms: React.FC<AffiliateAdminCmsProps> = ({
  currentAdminGamerTag = 'ViceAdmin',
  adminClearanceLevel = 'L4'
}) => {
  const [partners, setPartners] = useState<AffiliatePartner[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [editingPartner, setEditingPartner] = useState<AffiliatePartner | null>(null);
  const [saveStatus, setSaveStatus] = useState<{ id: string; success: boolean; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New partner form state
  const [newPartner, setNewPartner] = useState<Partial<AffiliatePartner>>({
    id: '',
    name: '',
    category: 'hosting',
    targetUrl: '',
    discountBadge: '',
    couponCode: '',
    isActive: true,
    commissionType: 'recurring',
    description: '',
    allowedRedirectDomains: []
  });

  const loadPartners = async () => {
    setIsLoading(true);
    try {
      const partnerMap = await initializeAffiliatesStore();
      const list = Object.values(partnerMap);
      setPartners(list);
    } catch (err) {
      console.error('[AffiliateAdminCms] Error loading partners:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPartners();
  }, []);

  const handleEditClick = (partner: AffiliatePartner) => {
    setEditingPartner({ ...partner });
    setSaveStatus(null);
  };

  const handleSavePartner = async (partnerToSave: AffiliatePartner) => {
    if (!partnerToSave.id || !partnerToSave.name || !partnerToSave.targetUrl) {
      setSaveStatus({ id: partnerToSave.id, success: false, message: 'Partner ID, Name, and Target URL are required.' });
      return;
    }

    setIsSaving(true);
    setSaveStatus(null);

    try {
      // Auto-extract host from targetUrl for allowedRedirectDomains
      let domains = partnerToSave.allowedRedirectDomains || [];
      try {
        const parsed = new URL(partnerToSave.targetUrl);
        if (!domains.includes(parsed.hostname)) {
          domains = [...domains, parsed.hostname];
        }
      } catch (e) {
        // ignore invalid URL during domain parse
      }

      const updated = await updateAffiliatePartner({
        ...partnerToSave,
        allowedRedirectDomains: domains
      });

      // Log to Staff Audit
      logStaffActivity({
        actionType: 'CMS_CONTENT_UPDATE',
        actionCategory: 'Content CMS',
        targetId: updated.id,
        targetName: updated.name,
        targetType: 'affiliate_partner',
        details: `Updated affiliate link (${updated.id}) to target URL: ${updated.targetUrl}. Coupon: ${updated.couponCode || 'None'}. Active: ${updated.isActive}`,
        actorOverride: {
          actorUsername: currentAdminGamerTag,
          actorClearance: adminClearanceLevel
        }
      });

      // Update local state list
      setPartners((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setEditingPartner(null);
      setSaveStatus({ id: updated.id, success: true, message: `Successfully saved ${updated.name} configuration!` });

      setTimeout(() => setSaveStatus(null), 4000);
    } catch (err: any) {
      setSaveStatus({ id: partnerToSave.id, success: false, message: err?.message || 'Failed to save partner.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (partner: AffiliatePartner) => {
    const updatedStatus = !partner.isActive;
    const updated = await updateAffiliatePartner({ ...partner, isActive: updatedStatus });
    setPartners((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));

    logStaffActivity({
      actionType: 'CMS_CONTENT_UPDATE',
      actionCategory: 'Content CMS',
      targetId: partner.id,
      targetName: partner.name,
      targetType: 'affiliate_partner',
      details: `Toggled active status of affiliate partner ${partner.id} to ${updatedStatus ? 'ACTIVE' : 'DISABLED'}`,
      actorOverride: {
        actorUsername: currentAdminGamerTag,
        actorClearance: adminClearanceLevel
      }
    });
  };

  const handleCreateNewPartner = async () => {
    if (!newPartner.id || !newPartner.name || !newPartner.targetUrl) {
      alert('Please fill out Partner ID, Name, and Target URL.');
      return;
    }

    const cleanId = newPartner.id.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const created: AffiliatePartner = {
      id: cleanId,
      name: newPartner.name,
      category: (newPartner.category as any) || 'hosting',
      targetUrl: newPartner.targetUrl,
      discountBadge: newPartner.discountBadge || '',
      couponCode: newPartner.couponCode || '',
      isActive: newPartner.isActive !== false,
      commissionType: (newPartner.commissionType as any) || 'percentage',
      description: newPartner.description || '',
      allowedRedirectDomains: []
    };

    try {
      const parsed = new URL(created.targetUrl);
      created.allowedRedirectDomains = [parsed.hostname];
    } catch (e) {}

    await updateAffiliatePartner(created);

    logStaffActivity({
      actionType: 'CMS_CONTENT_CREATE',
      actionCategory: 'Content CMS',
      targetId: created.id,
      targetName: created.name,
      targetType: 'affiliate_partner',
      details: `Added new affiliate partner ID ${created.id} pointing to ${created.targetUrl}`,
      actorOverride: {
        actorUsername: currentAdminGamerTag,
        actorClearance: adminClearanceLevel
      }
    });

    setPartners((prev) => [...prev.filter((p) => p.id !== created.id), created]);
    setShowAddModal(false);
    setNewPartner({
      id: '',
      name: '',
      category: 'hosting',
      targetUrl: '',
      discountBadge: '',
      couponCode: '',
      isActive: true,
      commissionType: 'recurring',
      description: '',
      allowedRedirectDomains: []
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-zinc-950 via-zinc-900 to-amber-950/30 p-5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
            <Link2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <span>Affiliate & Partner Link CMS Manager</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                ADMIN CONTROL
              </span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Customize outbound target URLs, coupon codes, promotional badges, and partner categories. Changes persist to Firestore and sync live.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={loadPartners}
            disabled={isLoading}
            className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-bold rounded-xl border border-zinc-700 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Reload</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Custom Partner</span>
          </button>
        </div>
      </div>

      {/* Save Success / Error Alert Banner */}
      {saveStatus && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs font-bold ${
            saveStatus.success
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {saveStatus.success ? <Check className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            <span>{saveStatus.message}</span>
          </div>
          <button onClick={() => setSaveStatus(null)} className="text-zinc-400 hover:text-white text-xs">Dismiss</button>
        </div>
      )}

      {/* Partners List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {partners.map((partner) => {
          const isEditing = editingPartner?.id === partner.id;
          const currentData = isEditing ? editingPartner : partner;
          const redirectTestUrl = getAffiliateRedirectUrl(partner.id, 'admin_cms_test');

          return (
            <div
              key={partner.id}
              className={`rounded-2xl border p-5 transition-all space-y-4 ${
                partner.isActive
                  ? 'bg-zinc-900/90 border-zinc-800 hover:border-amber-500/40 shadow-lg'
                  : 'bg-zinc-950/60 border-zinc-900 opacity-60'
              }`}
            >
              {/* Top Card Bar */}
              <div className="flex items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-zinc-800 text-amber-400 border border-zinc-700">
                    {partner.category}
                  </span>
                  <h4 className="text-sm font-black text-white">{partner.name}</h4>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(partner)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      partner.isActive
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                    }`}
                    title="Toggle active visibility for this partner"
                  >
                    {partner.isActive ? (
                      <>
                        <ToggleRight className="w-4 h-4 text-emerald-400" />
                        <span>Active</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-4 h-4 text-zinc-500" />
                        <span>Disabled</span>
                      </>
                    )}
                  </button>

                  <a
                    href={redirectTestUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-cyan-400 border border-zinc-700 transition cursor-pointer"
                    title="Test Redirect Path in New Tab"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Editing Form vs Read-Only View */}
              {isEditing ? (
                <div className="space-y-3 bg-zinc-950/80 p-3.5 rounded-xl border border-amber-500/30">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                      Partner Display Name
                    </label>
                    <input
                      type="text"
                      value={currentData.name}
                      onChange={(e) => setEditingPartner({ ...currentData, name: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                      Target Affiliate Redirect URL
                    </label>
                    <input
                      type="url"
                      value={currentData.targetUrl}
                      onChange={(e) => setEditingPartner({ ...currentData, targetUrl: e.target.value })}
                      placeholder="https://partner.com/aff.php?ref=..."
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-amber-300 font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                        Coupon Code
                      </label>
                      <input
                        type="text"
                        value={currentData.couponCode || ''}
                        onChange={(e) => setEditingPartner({ ...currentData, couponCode: e.target.value })}
                        placeholder="e.g. VCC20"
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-emerald-400 font-mono focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                        Discount Badge Text
                      </label>
                      <input
                        type="text"
                        value={currentData.discountBadge || ''}
                        onChange={(e) => setEditingPartner({ ...currentData, discountBadge: e.target.value })}
                        placeholder="e.g. 20% OFF CODE: VCC20"
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                      Description / Subheadline
                    </label>
                    <textarea
                      rows={2}
                      value={currentData.description || ''}
                      onChange={(e) => setEditingPartner({ ...currentData, description: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                    <button
                      onClick={() => setEditingPartner(null)}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs font-bold rounded-lg cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSavePartner(currentData)}
                      disabled={isSaving}
                      className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-extrabold rounded-lg transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 text-xs">
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block">Target Outbound Link</span>
                    <a
                      href={partner.targetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-400 hover:underline font-mono truncate block"
                    >
                      {partner.targetUrl}
                    </a>
                  </div>

                  <div className="flex items-center justify-between gap-2 bg-zinc-950/50 p-2.5 rounded-xl border border-zinc-800">
                    <div className="flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5 text-amber-400" />
                      <span className="font-bold text-white">
                        {partner.couponCode ? `Code: ${partner.couponCode}` : 'No Coupon Code'}
                      </span>
                    </div>

                    <span className="text-[11px] font-mono text-emerald-400 font-bold">
                      {partner.discountBadge || 'Standard Offer'}
                    </span>
                  </div>

                  {partner.description && (
                    <p className="text-zinc-400 text-[11px] leading-relaxed">
                      {partner.description}
                    </p>
                  )}

                  <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-zinc-500 font-mono">
                      ID: {partner.id}
                    </span>

                    <button
                      onClick={() => handleEditClick(partner)}
                      className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-amber-400 hover:text-amber-300 font-bold rounded-lg transition cursor-pointer text-xs"
                    >
                      Edit Partner Settings
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal to Add Custom Partner */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-amber-500/40 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" />
                <span>Add Custom Affiliate Partner</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Partner Unique ID
                </label>
                <input
                  type="text"
                  value={newPartner.id || ''}
                  onChange={(e) => setNewPartner({ ...newPartner, id: e.target.value })}
                  placeholder="e.g. g2a_marketplace or custom_host"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Partner Display Name
                </label>
                <input
                  type="text"
                  value={newPartner.name || ''}
                  onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })}
                  placeholder="e.g. G2A Games & Cash Cards"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                    Category
                  </label>
                  <select
                    value={newPartner.category || 'hosting'}
                    onChange={(e) => setNewPartner({ ...newPartner, category: e.target.value as any })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="hosting">Hosting</option>
                    <option value="vpn">VPN / Routing</option>
                    <option value="game_keys">Game Keys</option>
                    <option value="hardware">Hardware / Gear</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                    Coupon Code
                  </label>
                  <input
                    type="text"
                    value={newPartner.couponCode || ''}
                    onChange={(e) => setNewPartner({ ...newPartner, couponCode: e.target.value })}
                    placeholder="e.g. VCC5"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-emerald-400 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Target Outbound Affiliate URL
                </label>
                <input
                  type="url"
                  value={newPartner.targetUrl || ''}
                  onChange={(e) => setNewPartner({ ...newPartner, targetUrl: e.target.value })}
                  placeholder="https://partner.com/a/vicecitycentral"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-amber-300 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newPartner.description || ''}
                  onChange={(e) => setNewPartner({ ...newPartner, description: e.target.value })}
                  placeholder="Short marketing headline or features"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-300 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNewPartner}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black rounded-xl cursor-pointer shadow"
              >
                Create Partner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
