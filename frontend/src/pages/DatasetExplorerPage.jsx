import React, { useState, useEffect } from 'react';
import {
  Database,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Layers,
  Users,
  SlidersHorizontal,
  Download,
  Info,
  CheckCircle2,
  Table as TableIcon
} from 'lucide-react';
import StateBadge from '../components/StateBadge';
import api from '../services/api';

export default function DatasetExplorerPage() {
  const [datasetType, setDatasetType] = useState('train'); // 'train' | 'test'
  const [records, setRecords] = useState([]);
  const [columns, setColumns] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [activityFilter, setActivityFilter] = useState('ALL');
  const [subjectFilter, setSubjectFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Available filters from backend
  const [activitiesList, setActivitiesList] = useState([]);
  const [trainSubjects, setTrainSubjects] = useState([]);
  const [testSubjects, setTestSubjects] = useState([]);
  const [totalFeatures, setTotalFeatures] = useState(561);

  useEffect(() => {
    loadMetadata();
  }, []);

  useEffect(() => {
    loadDataset();
  }, [datasetType, page, limit, activityFilter, subjectFilter]);

  const loadMetadata = async () => {
    try {
      const dash = await api.getDashboard();
      setActivitiesList(dash.activities || []);
      setTotalFeatures(dash.num_sensor_features || 561);
    } catch (err) {
      console.error('Failed to load dataset metadata', err);
    }
  };

  const loadDataset = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page,
        limit,
        activity: activityFilter !== 'ALL' ? activityFilter : undefined,
        subject: subjectFilter !== 'ALL' ? subjectFilter : undefined,
        search: searchQuery.trim() || undefined,
      };

      const res =
        datasetType === 'train'
          ? await api.getTrainDataset(params)
          : await api.getTestDataset(params);

      setRecords(res.records || []);
      setColumns(res.available_columns || []);
      setTotalRecords(res.total_records || 0);
      setTotalPages(res.total_pages || 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadDataset();
  };

  const handleResetFilters = () => {
    setActivityFilter('ALL');
    setSubjectFilter('ALL');
    setSearchQuery('');
    setPage(1);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Title & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white">Dataset Explorer</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              Backend Paginated
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Browse and query authentic observations from the UCI Human Activity Recognition Benchmark
          </p>
        </div>

        {/* Dataset Partition Switcher Tabs */}
        <div className="flex items-center p-1 rounded-xl bg-charcoal-900 border border-slate-800 self-start md:self-auto">
          <button
            onClick={() => {
              setDatasetType('train');
              setPage(1);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              datasetType === 'train'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-navy-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Train Dataset (7,352)</span>
          </button>
          <button
            onClick={() => {
              setDatasetType('test');
              setPage(1);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              datasetType === 'test'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-navy-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Test Dataset (2,947)</span>
          </button>
        </div>
      </div>

      {/* Dataset Dimension Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl bg-charcoal-900/80 p-3 border border-slate-800">
          <div className="text-[11px] text-slate-400 uppercase font-medium">Dataset Partition</div>
          <div className="text-base font-bold text-white capitalize">{datasetType} Set</div>
        </div>
        <div className="rounded-xl bg-charcoal-900/80 p-3 border border-slate-800">
          <div className="text-[11px] text-slate-400 uppercase font-medium">Total Dimension</div>
          <div className="text-base font-bold text-cyan-400">
            {datasetType === 'train' ? '7,352 × 563' : '2,947 × 563'}
          </div>
        </div>
        <div className="rounded-xl bg-charcoal-900/80 p-3 border border-slate-800">
          <div className="text-[11px] text-slate-400 uppercase font-medium">Filtered Matches</div>
          <div className="text-base font-bold text-emerald-400">
            {totalRecords.toLocaleString()} rows
          </div>
        </div>
        <div className="rounded-xl bg-charcoal-900/80 p-3 border border-slate-800">
          <div className="text-[11px] text-slate-400 uppercase font-medium">Sensor Features</div>
          <div className="text-base font-bold text-purple-400">561 Vector Signals</div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="rounded-2xl bg-charcoal-900/90 p-4 border border-slate-800/80 shadow-lg space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by activity name (e.g. WALKING, LAYING) or subject ID..."
              className="w-full pl-10 pr-20 py-2.5 rounded-xl bg-navy-950 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-semibold"
            >
              Search
            </button>
          </form>

          {/* Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Activity Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 font-medium">Activity:</span>
              <select
                value={activityFilter}
                onChange={(e) => {
                  setActivityFilter(e.target.value);
                  setPage(1);
                }}
                className="py-2 px-3 rounded-xl bg-navy-950 border border-slate-700/80 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">All Activities (6)</option>
                {activitiesList.map((act) => (
                  <option key={act} value={act}>
                    {act}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 font-medium">Subject:</span>
              <select
                value={subjectFilter}
                onChange={(e) => {
                  setSubjectFilter(e.target.value);
                  setPage(1);
                }}
                className="py-2 px-3 rounded-xl bg-navy-950 border border-slate-700/80 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">All Subjects</option>
                {Array.from({ length: 30 }, (_, i) => i + 1).map((s) => (
                  <option key={s} value={s}>
                    Participant #{s}
                  </option>
                ))}
              </select>
            </div>

            {/* Page Limit */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 font-medium">Rows:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="py-2 px-3 rounded-xl bg-navy-950 border border-slate-700/80 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            {/* Reset */}
            {(activityFilter !== 'ALL' || subjectFilter !== 'ALL' || searchQuery) && (
              <button
                onClick={handleResetFilters}
                className="text-xs text-rose-400 hover:text-rose-300 font-medium underline"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Dataset Table Container */}
      <div className="rounded-2xl bg-charcoal-900/90 border border-slate-800/80 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TableIcon className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">
              Observations Table (Showing {records.length} of {totalRecords.toLocaleString()} matching records)
            </h3>
          </div>
          <div className="text-[11px] text-slate-400 hidden sm:block">
            Displaying Subject, Activity State, and Leading Sensor Vector Signals
          </div>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500/20 border-t-cyan-500" />
              <p className="text-xs text-slate-400">Fetching records from Flask backend...</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-400 text-xs">
            <p>Error loading dataset: {error}</p>
          </div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs space-y-2">
            <p className="text-sm font-semibold text-slate-300">No records match your filter criteria.</p>
            <p>Try clearing your search term or selecting All Activities.</p>
            <button
              onClick={handleResetFilters}
              className="mt-2 px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-semibold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-navy-950/80 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Row #</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Activity State</th>
                  {columns.slice(2).map((col) => (
                    <th key={col} className="py-3 px-4 font-mono truncate max-w-[150px]" title={col}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                {records.map((row, idx) => (
                  <tr
                    key={row.row_id || idx}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-2.5 px-4 text-slate-500 font-sans">
                      #{row.row_id}
                    </td>
                    <td className="py-2.5 px-4 font-sans font-semibold text-white">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800 text-cyan-300 text-xs">
                        <Users className="w-3 h-3 text-cyan-400" />
                        P-{row.subject}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-sans">
                      <StateBadge activity={row.Activity} size="sm" />
                    </td>
                    {columns.slice(2).map((col) => (
                      <td
                        key={col}
                        className={`py-2.5 px-4 text-right ${
                          row[col] > 0
                            ? 'text-cyan-400/90'
                            : row[col] < 0
                            ? 'text-amber-400/90'
                            : 'text-slate-400'
                        }`}
                      >
                        {typeof row[col] === 'number' ? row[col].toFixed(5) : row[col]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-800/80 bg-navy-950/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-400">
            Page <span className="font-semibold text-white">{page}</span> of{' '}
            <span className="font-semibold text-white">{totalPages}</span> (
            {totalRecords.toLocaleString()} total rows)
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(1)}
              disabled={page <= 1}
              className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-charcoal-900 text-slate-300 hover:border-cyan-500/40 disabled:opacity-40 disabled:hover:border-slate-800"
            >
              First
            </button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-800 bg-charcoal-900 text-slate-300 hover:border-cyan-500/40 disabled:opacity-40 disabled:hover:border-slate-800"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
            <span className="px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-bold">
              {page}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-800 bg-charcoal-900 text-slate-300 hover:border-cyan-500/40 disabled:opacity-40 disabled:hover:border-slate-800"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page >= totalPages}
              className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-charcoal-900 text-slate-300 hover:border-cyan-500/40 disabled:opacity-40 disabled:hover:border-slate-800"
            >
              Last
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
