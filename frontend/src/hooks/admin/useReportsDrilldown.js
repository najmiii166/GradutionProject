import { useState, useCallback } from 'react';

// useReportsDrilldown: manages drillType, drillRows, selectedDrill and loadDrilldown
// Expects to be called with current datePreset, startDate, endDate
export default function useReportsDrilldown(api, { datePreset, startDate, endDate } = {}) {
  const [drillType, setDrillType] = useState('none');
  const [drillRows, setDrillRows] = useState([]);
  const [selectedDrill, setSelectedDrill] = useState(null);

  const loadDrilldown = useCallback(async () => {
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

      if (drillType === 'topStudentUniversities') {
        const params = { type: 'topStudentUniversities', top: 50 };
        if (datePreset !== 'all') {
          if (start) params.start = start;
          if (end) params.end = end;
        }
        const { data } = await api.get('/admin/reports/drilldown/students', { params });
        setDrillRows(data.rows || []);
      } else if (drillType === 'topStudentAreas') {
        const params = { type: 'topStudentAreas', top: 50 };
        if (datePreset !== 'all') {
          if (start) params.start = start;
          if (end) params.end = end;
        }
        const { data } = await api.get('/admin/reports/drilldown/students', { params });
        setDrillRows(data.rows || []);
      } else {
        setDrillRows([]);
      }
    } catch (err) {
      console.error('Failed to load drilldown', err);
      setDrillRows([]);
    }
  }, [api, datePreset, startDate, endDate, drillType]);

  // applyDrillToRows returns filtered rows based on drill selection (verbatim logic)
  const applyDrillToRows = useCallback((originalRows, d) => {
    if (drillType === 'topStudentUniversities') {
      return (originalRows || []).filter(r => (r.institution || '').toLowerCase() === String(d._id || '').toLowerCase());
    } else if (drillType === 'topStudentAreas') {
      return (originalRows || []).filter(r => {
        const areas = Array.isArray(r.mentorshipAreas) ? r.mentorshipAreas : (r.mentorshipAreas ? [r.mentorshipAreas] : []);
        return areas.map(a => String(a || '').toLowerCase()).includes(String(d._id || '').toLowerCase());
      });
    }
    return originalRows || [];
  }, [drillType]);

  return {
    drillType,
    setDrillType,
    drillRows,
    loadDrilldown,
    selectedDrill,
    setSelectedDrill,
    applyDrillToRows,
  };
}
