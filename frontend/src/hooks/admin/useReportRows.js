import { useState, useCallback } from 'react';

// useReportRows: manages rows, filters, university ratios, export logic (verbatim)
export default function useReportRows(api) {
  const [roleFilter, setRoleFilter] = useState('mentor');
  const [datePreset, setDatePreset] = useState('this_month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [rows, setRows] = useState([]);
  const [originalRows, setOriginalRows] = useState([]);
  const [rowsLoading, setRowsLoading] = useState(false);
  const [applied, setApplied] = useState(false);
  const [uniRatios, setUniRatios] = useState([]);

  const loadUserRows = useCallback(async () => {
    setRowsLoading(true);
    try {
      let start = null;
      let end = null;
      const now = new Date();
      if (datePreset === 'this_month') {
        start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        end = new Date().toISOString();
      } else if (datePreset === 'last_month') {
        const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const last = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        start = first.toISOString();
        end = last.toISOString();
      } else if (datePreset === 'range') {
        if (startDate) start = new Date(startDate).toISOString();
        if (endDate) {
          const d = new Date(endDate);
          d.setHours(23,59,59,999);
          end = d.toISOString();
        }
      }

      const params = { role: roleFilter };
      if (datePreset === 'all') {
        // 'All' removes date filtering and requests full rows
        params.full = true;
      } else {
        if (start) params.start = start;
        if (end) params.end = end;
        params.top = 1000;
      }

      const { data } = await api.get('/admin/reports/users', { params });
      setRows(data.rows || []);
      setOriginalRows(data.rows || []);
      setApplied(true);
    } catch (err) {
      console.error('Failed to load rows', err);
      setRows([]);
    } finally {
      setRowsLoading(false);
    }
  }, [api, datePreset, startDate, endDate, roleFilter]);

  const loadUniversityRatios = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/reports/university-ratios');
      setUniRatios(data.rows || []);
    } catch (err) {
      console.error('Failed to load university ratios', err);
      setUniRatios([]);
    }
  }, [api]);

  const exportTablePdf = useCallback(async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      doc.setFontSize(14);
      doc.text('System Report – Users', 40, 30);

      autoTable(doc, {
        startY: 50,
        head: [['Name', 'Email', 'Role', 'Institution', 'Joined']],
        body: rows.map(r => [
          r.name || '-',
          r.email || '-',
          r.role || '-',
          r.institution || '-',
          r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '-',
        ]),
        styles: { fontSize: 9, cellPadding: 4 },
        headStyles: { fillColor: [6, 182, 212], textColor: 255 }, // cyan-500 color
      });

      doc.save(`users-report-${Date.now()}.pdf`);
    } catch (err) {
      console.error('PDF export failed', err);
      alert('PDF export failed. Check console.');
    }
  }, [rows]);

  return {
    // filters & setters
    roleFilter,
    setRoleFilter,
    datePreset,
    setDatePreset,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    // rows
    rows,
    setRows,
    originalRows,
    setOriginalRows,
    rowsLoading,
    applied,
    setApplied,
    // load actions
    loadUserRows,
    loadUniversityRatios,
    uniRatios,
    // export
    exportTablePdf,
  };
}
