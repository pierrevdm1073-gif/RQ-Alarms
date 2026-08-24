import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User, Alarm, Feedback, DriverShift, Vehicle } from '../types';
import { 
  CheckCircle2, 
  FileText, 
  Clock, 
  MapPin, 
  Car, 
  ShieldAlert, 
  Calendar,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info,
  Search,
  Filter,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  History,
  Activity,
  Layers,
  ArrowUpRight,
  Printer,
  X,
  MessageSquare,
  ShieldCheck,
  Zap,
  RotateCcw
} from 'lucide-react';

interface DriverHistoryProps {
  user: User;
  currentShiftActive?: boolean;
  currentVehicle?: Vehicle | null;
}

export default function DriverHistory({ user, currentShiftActive }: DriverHistoryProps) {
  const [completedAlarms, setCompletedAlarms] = useState<Alarm[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [shifts, setShifts] = useState<DriverShift[]>([]);
  const [activeShift, setActiveShift] = useState<DriverShift | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & Tabs
  const [categoryTab, setCategoryTab] = useState<'all' | 'dispatches' | 'reports' | 'shifts'>('all');
  const [shiftFilter, setShiftFilter] = useState<'all' | 'current' | 'previous' | string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'yesterday' | 'week'>('all');

  // Expanded items
  const [expandedAlarmId, setExpandedAlarmId] = useState<number | null>(null);
  const [expandedReportId, setExpandedReportId] = useState<number | null>(null);
  const [expandedShiftId, setExpandedShiftId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);

  const fetchHistory = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const res = await fetch(`/api/drivers/${user.id}/history`);
      if (!res.ok) {
        throw new Error('Failed to retrieve driver history log');
      }
      const json = await res.json();
      setCompletedAlarms(json.completedAlarms || []);
      setFeedbacks(json.feedbacks || []);
      setShifts(json.shifts || []);
      setActiveShift(json.activeShift || null);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching driver history:', err);
      setError(err.message || 'Unable to load service history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Helper to check time filter
  const matchesTimeFilter = (dateString: string): boolean => {
    if (timeFilter === 'all') return true;
    const itemDate = new Date(dateString);
    const now = new Date();
    
    if (timeFilter === 'today') {
      return itemDate.toDateString() === now.toDateString();
    }
    
    if (timeFilter === 'yesterday') {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      return itemDate.toDateString() === yesterday.toDateString();
    }
    
    if (timeFilter === 'week') {
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);
      return itemDate >= sevenDaysAgo;
    }
    
    return true;
  };

  // Helper to check shift filter for a given date
  const matchesShiftFilter = (dateString: string): boolean => {
    if (shiftFilter === 'all') return true;
    const itemTime = new Date(dateString).getTime();

    if (shiftFilter === 'current') {
      if (!activeShift?.start_time) return false;
      const shiftStartTime = new Date(activeShift.start_time).getTime();
      return itemTime >= shiftStartTime;
    }

    if (shiftFilter === 'previous') {
      if (activeShift?.start_time) {
        const shiftStartTime = new Date(activeShift.start_time).getTime();
        return itemTime < shiftStartTime;
      }
      return true;
    }

    // Specific shift ID like 'shift-12'
    if (shiftFilter.startsWith('shift-')) {
      const shiftId = parseInt(shiftFilter.replace('shift-', ''), 10);
      const targetShift = shifts.find(s => s.id === shiftId);
      if (!targetShift) return true;
      const startTime = new Date(targetShift.start_time).getTime();
      const endTime = targetShift.end_time ? new Date(targetShift.end_time).getTime() : Date.now();
      return itemTime >= startTime && itemTime <= endTime;
    }

    return true;
  };

  // Filtered Alarms
  const filteredAlarms = useMemo(() => {
    return completedAlarms.filter(alarm => {
      // Shift filter
      if (!matchesShiftFilter(alarm.created_at)) return false;

      // Time filter
      if (!matchesTimeFilter(alarm.created_at)) return false;

      // Priority filter
      if (priorityFilter !== 'all' && alarm.priority !== priorityFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const clientName = (alarm.client_name || '').toLowerCase();
        const address = (alarm.address || '').toLowerCase();
        const alarmType = (alarm.alarm_type || '').toLowerCase();
        const incident = (alarm.incident_details || '').toLowerCase();
        const veh = (alarm.vehicle_registration || '').toLowerCase();
        return clientName.includes(q) || address.includes(q) || alarmType.includes(q) || incident.includes(q) || veh.includes(q);
      }

      return true;
    });
  }, [completedAlarms, shiftFilter, timeFilter, priorityFilter, searchQuery, activeShift, shifts]);

  // Filtered Feedbacks (Incident Reports)
  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter(report => {
      // Shift filter
      if (!matchesShiftFilter(report.created_at)) return false;

      // Time filter
      if (!matchesTimeFilter(report.created_at)) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const clientName = (report.client_name || '').toLowerCase();
        const address = (report.address || '').toLowerCase();
        const text = (report.feedback_text || '').toLowerCase();
        const analysis = (report.image_analysis || '').toLowerCase();
        const adminResp = (report.admin_response || '').toLowerCase();
        const veh = (report.vehicle_registration || '').toLowerCase();
        return clientName.includes(q) || address.includes(q) || text.includes(q) || analysis.includes(q) || adminResp.includes(q) || veh.includes(q);
      }

      return true;
    });
  }, [feedbacks, shiftFilter, timeFilter, searchQuery, activeShift, shifts]);

  // Filtered Shifts
  const filteredShifts = useMemo(() => {
    return shifts.filter(shift => {
      if (shiftFilter === 'current') {
        return !shift.end_time;
      }
      if (shiftFilter === 'previous') {
        return !!shift.end_time;
      }
      if (shiftFilter.startsWith('shift-')) {
        return shift.id === parseInt(shiftFilter.replace('shift-', ''), 10);
      }
      if (timeFilter !== 'all') {
        return matchesTimeFilter(shift.start_time);
      }
      return true;
    });
  }, [shifts, shiftFilter, timeFilter]);

  // Stats
  const totalCompletedDispatches = completedAlarms.length;
  const totalReportsSubmitted = feedbacks.length;
  const totalCompletedShifts = shifts.filter(s => s.end_time).length;
  const currentShiftDispatchesCount = activeShift 
    ? completedAlarms.filter(a => new Date(a.created_at).getTime() >= new Date(activeShift.start_time).getTime()).length
    : 0;
  const currentShiftReportsCount = activeShift
    ? feedbacks.filter(f => new Date(f.created_at).getTime() >= new Date(activeShift.start_time).getTime()).length
    : 0;

  const formatDuration = (startStr: string, endStr?: string | null) => {
    const start = new Date(startStr).getTime();
    const end = endStr ? new Date(endStr).getTime() : Date.now();
    const totalMinutes = Math.max(0, Math.floor((end - start) / (1000 * 60)));
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center flex flex-col items-center justify-center min-h-[380px] shadow-sm">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-800 font-extrabold text-base">Retrieving Dispatch History...</p>
        <p className="text-xs text-slate-400 mt-1">Syncing resolved dispatches, submitted incident reports, and duty shifts</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-8 rounded-3xl border border-rose-100 text-center text-rose-600 flex flex-col items-center min-h-[320px] justify-center shadow-sm">
        <ShieldAlert size={44} className="text-rose-500 mb-3 animate-bounce" />
        <h3 className="font-extrabold text-lg text-slate-900">History Synchronization Failed</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">{error}</p>
        <button 
          onClick={() => fetchHistory(false)} 
          className="mt-5 px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition-all shadow-md cursor-pointer flex items-center gap-2"
        >
          <RotateCcw size={14} />
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      
      {/* Top Header & Refresh Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center font-bold shrink-0">
              <History size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                Dispatch History
                {activeShift && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    On Active Shift
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500">
                Review past dispatches, submitted incident reports, and duty performance records.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setShowExportModal(true)}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              title="View formatted summary of filtered records"
            >
              <Printer size={14} />
              <span className="hidden sm:inline">Export / Print</span>
            </button>

            <button
              type="button"
              id="btn-refresh-driver-history"
              onClick={() => fetchHistory(true)}
              disabled={refreshing}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              title="Refresh history logs from server"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin text-rq-gold" : ""} />
              <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Shift Scope Filter Banner */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 max-w-full text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Shift Scope:</span>
            
            <button
              type="button"
              onClick={() => setShiftFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
                shiftFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Records ({completedAlarms.length})
            </button>

            <button
              type="button"
              onClick={() => setShiftFilter('current')}
              disabled={!activeShift}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                shiftFilter === 'current'
                  ? 'bg-amber-500 text-slate-900 font-extrabold shadow-xs'
                  : 'bg-amber-50 text-amber-800 border border-amber-200/60 hover:bg-amber-100'
              }`}
            >
              <Zap size={13} className={activeShift ? "text-amber-700 animate-pulse" : ""} />
              Current Shift ({currentShiftDispatchesCount} callouts)
            </button>

            <button
              type="button"
              onClick={() => setShiftFilter('previous')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
                shiftFilter === 'previous'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Previous Shifts ({totalCompletedShifts} shifts)
            </button>

            {/* Past Shift Selector Dropdown */}
            {shifts.filter(s => s.end_time).length > 0 && (
              <select
                value={shiftFilter.startsWith('shift-') ? shiftFilter : ''}
                onChange={(e) => {
                  if (e.target.value) setShiftFilter(e.target.value);
                }}
                className="px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <option value="" disabled>Specific Shift...</option>
                {shifts.filter(s => s.end_time).map(shift => (
                  <option key={shift.id} value={`shift-${shift.id}`}>
                    Shift #{shift.id} ({new Date(shift.start_time).toLocaleDateString()} - {formatDuration(shift.start_time, shift.end_time)})
                  </option>
                ))}
              </select>
            )}
          </div>

          {shiftFilter !== 'all' && (
            <button
              type="button"
              onClick={() => setShiftFilter('all')}
              className="text-[11px] font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer underline"
            >
              Clear shift filter
            </button>
          )}
        </div>
      </div>

      {/* KPI Overview Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">Dispatches</span>
            <span className="text-lg font-black text-slate-900">{filteredAlarms.length}</span>
            <span className="text-[10px] text-slate-400 block truncate">
              {shiftFilter === 'current' ? 'this shift' : 'resolved total'}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600 shrink-0">
            <FileText size={20} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">Incident Reports</span>
            <span className="text-lg font-black text-slate-900">{filteredFeedbacks.length}</span>
            <span className="text-[10px] text-slate-400 block truncate">
              {shiftFilter === 'current' ? `${currentShiftReportsCount} this shift` : 'submitted forms'}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600 shrink-0">
            <Sparkles size={20} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">Mgmt Responses</span>
            <span className="text-lg font-black text-slate-900">
              {feedbacks.filter(f => f.admin_response).length}
            </span>
            <span className="text-[10px] text-slate-400 block truncate">feedback replies</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-purple-50 rounded-xl text-purple-600 shrink-0">
            <Clock size={20} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">Shift Logs</span>
            <span className="text-lg font-black text-slate-900">{shifts.length}</span>
            <span className="text-[10px] text-slate-400 block truncate">
              {activeShift ? '1 active on duty' : 'completed shifts'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Filter & Category Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3">
        
        {/* Category Mode Pills */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/60 overflow-x-auto gap-1">
          <button
            type="button"
            onClick={() => setCategoryTab('all')}
            className={`flex-1 py-2 px-3 rounded-xl text-center font-bold text-xs transition-all whitespace-nowrap cursor-pointer flex items-center justify-center gap-1.5 ${
              categoryTab === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers size={14} />
            All Activity ({filteredAlarms.length + filteredFeedbacks.length})
          </button>

          <button
            type="button"
            onClick={() => setCategoryTab('dispatches')}
            className={`flex-1 py-2 px-3 rounded-xl text-center font-bold text-xs transition-all whitespace-nowrap cursor-pointer flex items-center justify-center gap-1.5 ${
              categoryTab === 'dispatches'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <CheckCircle2 size={14} className="text-emerald-600" />
            Dispatches ({filteredAlarms.length})
          </button>

          <button
            type="button"
            onClick={() => setCategoryTab('reports')}
            className={`flex-1 py-2 px-3 rounded-xl text-center font-bold text-xs transition-all whitespace-nowrap cursor-pointer flex items-center justify-center gap-1.5 ${
              categoryTab === 'reports'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText size={14} className="text-blue-600" />
            Incident Reports ({filteredFeedbacks.length})
          </button>

          <button
            type="button"
            onClick={() => setCategoryTab('shifts')}
            className={`flex-1 py-2 px-3 rounded-xl text-center font-bold text-xs transition-all whitespace-nowrap cursor-pointer flex items-center justify-center gap-1.5 ${
              categoryTab === 'shifts'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock size={14} className="text-purple-600" />
            Shift Roster ({filteredShifts.length})
          </button>
        </div>

        {/* Search and Secondary Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-1">
          {/* Search Box */}
          <div className="sm:col-span-6 relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              id="search-driver-history"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by client, address, vehicle, keyword..."
              className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Priority Filter */}
          <div className="sm:col-span-3">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/20 transition-all cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical Priority</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>

          {/* Time Window Filter */}
          <div className="sm:col-span-3">
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as any)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/20 transition-all cursor-pointer"
            >
              <option value="all">All Dates</option>
              <option value="today">Today Only</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">Past 7 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main List Rendering */}
      <div className="space-y-3.5">
        
        {/* --- VIEW: DISPATCHES (OR ALL WITH DISPATCHES) --- */}
        {(categoryTab === 'all' || categoryTab === 'dispatches') && (
          <div className="space-y-3">
            {categoryTab === 'all' && (
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  Past Dispatches & Callouts ({filteredAlarms.length})
                </h3>
              </div>
            )}

            {filteredAlarms.length === 0 ? (
              categoryTab === 'dispatches' && (
                <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-300 p-6">
                  <div className="w-12 h-12 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 size={24} />
                  </div>
                  <h4 className="text-slate-700 font-bold text-sm">No Dispatches Found</h4>
                  <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">
                    {searchQuery || priorityFilter !== 'all' || timeFilter !== 'all' || shiftFilter !== 'all'
                      ? 'No completed assignments match your selected search or shift filters.'
                      : 'Callouts you complete during your shifts will be catalogued here.'}
                  </p>
                  {(searchQuery || priorityFilter !== 'all' || timeFilter !== 'all' || shiftFilter !== 'all') && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setPriorityFilter('all');
                        setTimeFilter('all');
                        setShiftFilter('all');
                      }}
                      className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      Reset All Filters
                    </button>
                  )}
                </div>
              )
            ) : (
              filteredAlarms.map(alarm => {
                const isExpanded = expandedAlarmId === alarm.id;
                const linkedFeedback = feedbacks.find(f => f.alarm_id === alarm.id);
                const isCopied = copiedId === `alarm-${alarm.id}`;

                return (
                  <div 
                    key={`alarm-${alarm.id}`}
                    id={`history-dispatch-${alarm.id}`}
                    className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all text-left"
                  >
                    {/* Header line */}
                    <div 
                      onClick={() => setExpandedAlarmId(prev => prev === alarm.id ? null : alarm.id)}
                      className="flex justify-between items-start gap-3 cursor-pointer select-none"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200/60">
                            {alarm.alarm_type || 'Alarm'}
                          </span>
                          
                          <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider ${
                            alarm.priority === 'critical' ? 'bg-red-50 text-red-700 border border-red-200' :
                            alarm.priority === 'high' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            alarm.priority === 'medium' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            'bg-slate-50 text-slate-600 border border-slate-200'
                          }`}>
                            {alarm.priority} priority
                          </span>

                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                            alarm.status === 'completed' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {alarm.status === 'completed' ? '✓ Resolved' : alarm.status}
                          </span>

                          {linkedFeedback && (
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                              <FileText size={10} /> Report Attached
                            </span>
                          )}

                          {alarm.vehicle_registration && (
                            <span className="flex items-center gap-1 text-[10px] text-slate-500 font-mono bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                              <Car size={11} className="text-slate-400" />
                              {alarm.vehicle_registration}
                            </span>
                          )}
                        </div>

                        <h4 className="font-black text-slate-900 text-base sm:text-lg tracking-tight truncate">
                          {alarm.client_name}
                        </h4>

                        <p className="text-slate-500 text-xs flex items-center gap-1.5 truncate">
                          <MapPin size={13} className="text-amber-500 shrink-0" />
                          <span className="truncate">{alarm.address}</span>
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className="text-[11px] text-slate-500 font-bold bg-slate-50 px-2.5 py-1 rounded-xl flex items-center gap-1.5 border border-slate-100 font-mono">
                          <Calendar size={12} className="text-slate-400" />
                          {new Date(alarm.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          <span className="text-slate-400">|</span>
                          {new Date(alarm.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        
                        <div className="flex items-center gap-1 text-slate-400 hover:text-slate-700 text-xs font-semibold">
                          <span>{isExpanded ? 'Hide' : 'Details'}</span>
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                      </div>
                    </div>

                    {/* Expandable Details Tray */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-slate-100 space-y-4 animate-in fade-in duration-150">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
                          
                          {/* Original Dispatch Incident Notes */}
                          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60 space-y-2">
                            <span className="font-extrabold text-slate-900 flex items-center gap-1.5 text-xs">
                              <Info size={14} className="text-amber-500" />
                              Control Room Instructions & Details
                            </span>
                            <p className="text-slate-700 leading-relaxed font-normal whitespace-pre-wrap">
                              {alarm.incident_details || "No original dispatch details provided."}
                            </p>
                            
                            {alarm.lat && alarm.lng && (
                              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                                <span>GPS: {alarm.lat.toFixed(5)}, {alarm.lng.toFixed(5)}</span>
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${alarm.lat},${alarm.lng}`}
                                  target="_blank"
                                  rel="noreferrer noopener"
                                  className="text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1"
                                >
                                  Maps <ArrowUpRight size={12} />
                                </a>
                              </div>
                            )}
                          </div>

                          {/* Linked Report Submitted by Driver */}
                          <div className="bg-blue-50/40 p-3.5 rounded-2xl border border-blue-100 space-y-2">
                            <span className="font-extrabold text-blue-900 flex items-center gap-1.5 text-xs">
                              <FileText size={14} className="text-blue-600" />
                              Your Submitted Incident Report
                            </span>
                            
                            {linkedFeedback ? (
                              <div className="space-y-2">
                                <p className="text-slate-800 leading-relaxed font-medium whitespace-pre-wrap">
                                  {linkedFeedback.feedback_text}
                                </p>

                                {linkedFeedback.image_analysis && (
                                  <div className="p-2 bg-white rounded-xl border border-emerald-200/80 flex items-start gap-2 text-[11px] text-emerald-800">
                                    <Sparkles size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                                    <div>
                                      <span className="font-bold">AI Image Verification: </span>
                                      <span>{linkedFeedback.image_analysis}</span>
                                    </div>
                                  </div>
                                )}

                                {linkedFeedback.admin_response && (
                                  <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2 text-xs text-amber-950">
                                    <MessageSquare size={14} className="text-amber-600 shrink-0 mt-0.5" />
                                    <div>
                                      <span className="font-bold text-amber-900 uppercase tracking-wider text-[10px] block">
                                        Management Response:
                                      </span>
                                      <p className="font-medium mt-0.5">{linkedFeedback.admin_response}</p>
                                    </div>
                                  </div>
                                )}

                                <div className="text-[10px] text-slate-400 font-mono pt-1">
                                  Submitted at: {new Date(linkedFeedback.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
                            ) : (
                              <p className="text-slate-400 italic py-2">
                                No written report submitted for this dispatch.
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Action Bar */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(
                              `[DISPATCH #${alarm.id}] Client: ${alarm.client_name}\nAddress: ${alarm.address}\nPriority: ${alarm.priority}\nDetails: ${alarm.incident_details || 'N/A'}${linkedFeedback ? `\nReport: ${linkedFeedback.feedback_text}` : ''}`,
                              `alarm-${alarm.id}`
                            )}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            {isCopied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                            <span>{isCopied ? 'Summary Copied' : 'Copy Dispatch Summary'}</span>
                          </button>

                          <div className="text-[11px] text-slate-400 font-mono">
                            Ref ID: #DSP-{alarm.id}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* --- VIEW: INCIDENT REPORTS (OR ALL WITH REPORTS) --- */}
        {(categoryTab === 'all' || categoryTab === 'reports') && (
          <div className="space-y-3 pt-2">
            {categoryTab === 'all' && (
              <div className="flex items-center justify-between px-1 mt-6">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <FileText size={14} className="text-blue-600" />
                  Submitted Incident Reports ({filteredFeedbacks.length})
                </h3>
              </div>
            )}

            {filteredFeedbacks.length === 0 ? (
              categoryTab === 'reports' && (
                <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-300 p-6">
                  <div className="w-12 h-12 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FileText size={24} />
                  </div>
                  <h4 className="text-slate-700 font-bold text-sm">No Incident Reports Found</h4>
                  <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">
                    {searchQuery || timeFilter !== 'all' || shiftFilter !== 'all'
                      ? 'No submitted incident reports match your current search or shift filter.'
                      : 'Reports and field observations you submit after responding to an alarm will appear here.'}
                  </p>
                </div>
              )
            ) : (
              filteredFeedbacks.map(report => {
                const isExpanded = expandedReportId === report.id;
                const linkedAlarm = completedAlarms.find(a => a.id === report.alarm_id);
                const isCopied = copiedId === `report-${report.id}`;

                return (
                  <div 
                    key={`report-${report.id}`}
                    id={`history-report-${report.id}`}
                    className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all text-left"
                  >
                    <div 
                      onClick={() => setExpandedReportId(prev => prev === report.id ? null : report.id)}
                      className="flex justify-between items-start gap-3 cursor-pointer select-none"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                            Report #{report.id}
                          </span>

                          {report.admin_response && (
                            <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                              <Sparkles size={10} className="text-amber-600" /> Mgmt Replied
                            </span>
                          )}

                          {report.image_analysis && (
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                              <ShieldCheck size={10} /> AI Verified
                            </span>
                          )}

                          {report.vehicle_registration && (
                            <span className="flex items-center gap-1 text-[10px] text-slate-500 font-mono bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                              <Car size={11} className="text-slate-400" />
                              {report.vehicle_registration}
                            </span>
                          )}
                        </div>

                        <h4 className="font-black text-slate-900 text-base sm:text-lg tracking-tight truncate">
                          {report.client_name}
                        </h4>

                        <p className="text-slate-500 text-xs flex items-center gap-1.5 truncate">
                          <MapPin size={13} className="text-amber-500 shrink-0" />
                          <span className="truncate">{report.address}</span>
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className="text-[11px] text-slate-500 font-bold bg-slate-50 px-2.5 py-1 rounded-xl flex items-center gap-1.5 border border-slate-100 font-mono">
                          <Calendar size={12} className="text-slate-400" />
                          {new Date(report.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                        
                        <div className="flex items-center gap-1 text-slate-400 hover:text-slate-700 text-xs font-semibold">
                          <span>{isExpanded ? 'Hide' : 'Details'}</span>
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                      </div>
                    </div>

                    {/* Report Text Excerpt */}
                    <div className="mt-3 text-xs text-slate-800 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70 whitespace-pre-wrap leading-relaxed">
                      {report.feedback_text}
                    </div>

                    {/* AI Verification Callout */}
                    {report.image_analysis && (
                      <div className="mt-2.5 p-2.5 bg-emerald-50/60 rounded-2xl border border-emerald-200 flex items-start gap-2 text-xs text-emerald-900">
                        <Sparkles size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold block text-[11px] uppercase tracking-wider text-emerald-800">
                            AI Scene & Evidence Analysis
                          </span>
                          <p className="mt-0.5 text-slate-700">{report.image_analysis}</p>
                        </div>
                      </div>
                    )}

                    {/* Management Response */}
                    {report.admin_response && (
                      <div className="mt-2.5 p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200 flex items-start gap-2.5 text-xs text-slate-900">
                        <MessageSquare size={16} className="text-amber-600 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <span className="font-extrabold text-amber-900 uppercase tracking-wider text-[10px] block">
                            Management Acknowledgement & Response
                          </span>
                          <p className="font-medium leading-relaxed">{report.admin_response}</p>
                        </div>
                      </div>
                    )}

                    {/* Expanded Linked Alarm Tray */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-slate-100 space-y-3 animate-in fade-in duration-150">
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/60 text-xs">
                          <span className="font-bold text-slate-900 flex items-center gap-1 mb-2">
                            <Info size={13} className="text-slate-400" />
                            Associated Dispatch Context
                          </span>
                          {linkedAlarm ? (
                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                              <div>
                                <span className="text-slate-400 block font-semibold uppercase">Alarm Type</span>
                                <span className="font-bold text-slate-800">{linkedAlarm.alarm_type || 'General'}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block font-semibold uppercase">Priority</span>
                                <span className="font-bold text-slate-800 capitalize">{linkedAlarm.priority}</span>
                              </div>
                              <div className="col-span-2 mt-1">
                                <span className="text-slate-400 block font-semibold uppercase">Incident Instructions</span>
                                <span className="text-slate-700 block mt-0.5">{linkedAlarm.incident_details || "None provided"}</span>
                              </div>
                            </div>
                          ) : (
                            <p className="text-slate-400 italic">No linked alarm found.</p>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(
                              `[INCIDENT REPORT #${report.id}]\nClient: ${report.client_name}\nAddress: ${report.address}\nReport: ${report.feedback_text}\nDate: ${new Date(report.created_at).toLocaleString()}`,
                              `report-${report.id}`
                            )}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            {isCopied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                            <span>{isCopied ? 'Report Copied' : 'Copy Full Report'}</span>
                          </button>

                          <span className="text-[10px] text-slate-400 font-mono">
                            Submitted: {new Date(report.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* --- VIEW: SHIFT ROSTER --- */}
        {(categoryTab === 'shifts') && (
          <div className="space-y-3">
            {filteredShifts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-300 p-6">
                <div className="w-12 h-12 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Clock size={24} />
                </div>
                <h4 className="text-slate-700 font-bold text-sm">No Duty Shifts Recorded</h4>
                <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">
                  When you begin and finalize shifts, full duty logs with total distance and dispatches will appear here.
                </p>
              </div>
            ) : (
              filteredShifts.map(shift => {
                const isCurrent = !shift.end_time;
                const isExpanded = expandedShiftId === shift.id;
                
                // Shift dispatches
                const shiftStartTime = new Date(shift.start_time).getTime();
                const shiftEndTime = shift.end_time ? new Date(shift.end_time).getTime() : Date.now();
                const shiftAlarms = completedAlarms.filter(a => {
                  const t = new Date(a.created_at).getTime();
                  return t >= shiftStartTime && t <= shiftEndTime;
                });
                const shiftReports = feedbacks.filter(f => {
                  const t = new Date(f.created_at).getTime();
                  return t >= shiftStartTime && t <= shiftEndTime;
                });

                return (
                  <div 
                    key={`shift-${shift.id}`}
                    className={`bg-white border rounded-3xl p-4 sm:p-5 shadow-xs transition-all ${
                      isCurrent ? 'border-amber-400/80 bg-amber-50/10 ring-1 ring-amber-400/30' : 'border-slate-200 hover:shadow-md'
                    }`}
                  >
                    <div 
                      onClick={() => setExpandedShiftId(prev => prev === shift.id ? null : shift.id)}
                      className="flex justify-between items-start gap-3 cursor-pointer select-none"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider ${
                            isCurrent 
                              ? 'bg-amber-500 text-slate-900 animate-pulse' 
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {isCurrent ? '⚡ Active Duty Shift' : `Shift #${shift.id}`}
                          </span>

                          <span className="text-xs font-mono text-slate-400">
                            {formatDuration(shift.start_time, shift.end_time)}
                          </span>
                        </div>

                        <h4 className="font-black text-slate-900 text-base sm:text-lg tracking-tight">
                          {new Date(shift.start_time).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                        </h4>

                        <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                          <span>
                            Start: <strong className="text-slate-800">{new Date(shift.start_time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            End: <strong className="text-slate-800">{shift.end_time ? new Date(shift.end_time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : 'In Progress'}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-800 block">
                            {shiftAlarms.length} Dispatches
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {shift.distance_covered ? `${shift.distance_covered.toFixed(1)} km` : '0.0 km'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-slate-400 hover:text-slate-700 text-xs font-semibold">
                          <span>{isExpanded ? 'Hide' : 'Breakdown'}</span>
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                      </div>
                    </div>

                    {/* Shift Breakdown Tray */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-slate-100 space-y-3 animate-in fade-in duration-150 text-xs">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">Duration</span>
                            <span className="text-sm font-bold text-slate-800">{formatDuration(shift.start_time, shift.end_time)}</span>
                          </div>
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">Dispatches Resolved</span>
                            <span className="text-sm font-bold text-slate-800">{shiftAlarms.length} callouts</span>
                          </div>
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">Reports Filed</span>
                            <span className="text-sm font-bold text-slate-800">{shiftReports.length} reports</span>
                          </div>
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">Mileage</span>
                            <span className="text-sm font-bold text-slate-800">{shift.distance_covered ? `${shift.distance_covered.toFixed(1)} km` : '0.0 km'}</span>
                          </div>
                        </div>

                        {/* List of dispatches completed during this shift */}
                        {shiftAlarms.length > 0 && (
                          <div className="mt-2 space-y-1.5">
                            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                              Callouts in this shift:
                            </span>
                            {shiftAlarms.map(alarm => (
                              <div key={`shift-alarm-${alarm.id}`} className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                                <div className="truncate">
                                  <strong className="text-slate-800 font-bold">{alarm.client_name}</strong>
                                  <span className="text-slate-400 ml-2">({alarm.address})</span>
                                </div>
                                <span className="font-mono text-[10px] text-slate-400 shrink-0">
                                  {new Date(alarm.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Export / Print Preview Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden p-6 flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Printer size={20} className="text-amber-600" />
                <h3 className="text-base font-black text-slate-900 tracking-tight">Driver Dispatch & Shift Log Summary</h3>
              </div>
              <button 
                onClick={() => setShowExportModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1 font-mono text-[11px]">
                <div><strong>Officer / Driver:</strong> {user.username} (ID: #{user.id})</div>
                <div><strong>Current Filter:</strong> {shiftFilter.toUpperCase()} SHIFT | {timeFilter.toUpperCase()} TIME</div>
                <div><strong>Total Dispatches in Scope:</strong> {filteredAlarms.length}</div>
                <div><strong>Total Reports in Scope:</strong> {filteredFeedbacks.length}</div>
                <div><strong>Generated at:</strong> {new Date().toLocaleString()}</div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 uppercase text-[11px]">Resolved Callouts:</h4>
                {filteredAlarms.map((a, i) => (
                  <div key={i} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                    <div className="font-bold text-slate-900">{i + 1}. {a.client_name} ({a.priority} priority - {a.alarm_type || 'Alarm'})</div>
                    <div className="text-slate-500">Address: {a.address}</div>
                    {a.incident_details && <div className="text-slate-600">Details: {a.incident_details}</div>}
                    <div className="text-slate-400 text-[10px] font-mono">Date: {new Date(a.created_at).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                Print Report
              </button>
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
