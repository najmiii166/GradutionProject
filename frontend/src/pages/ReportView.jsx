import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getReport } from "../api/reportApi";
import Toast from "../components/Toast";

export default function ReportView() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await getReport(id);
        setReport(data.report);
      } catch (err) {
        console.error(err);
        setToast("Failed to load report");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const downloadPdf = () => {
    if (!report?.pdfContent) return setToast("No PDF available");
    const byteChars = atob(report.pdfContent);
    const byteNumbers = new Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${id}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      {loading ? (
        <div className="text-sm text-slate-400">Loading…</div>
      ) : !report ? (
        <div className="text-sm text-slate-400">Report not found.</div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold">{report.summary || 'AI Report'}</h2>
              <div className="text-xs text-slate-400">{new Date(report.createdAt).toLocaleString()}</div>
            </div>
            <div>
              <button className="px-3 py-1 rounded bg-sky-500 text-white" onClick={downloadPdf}>Download PDF</button>
            </div>
          </div>

          <div className="border rounded-md overflow-hidden" style={{height: '70vh'}}>
            <iframe title="report" srcDoc={report.htmlReport || '<p>No content</p>'} style={{width:'100%',height:'100%',border:0}} />
          </div>
        </>
      )}

      <Toast message={toast} onClose={() => setToast(null)} />
    </div>
  );
}
