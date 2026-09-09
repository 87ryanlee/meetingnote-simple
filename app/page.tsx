"use client";

import { ChangeEvent, DragEvent, useState } from "react";

type Result = { filename: string; transcript: string; summary: string; decisions: string[]; actionItems: string[] };

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  const choose = (next: File | undefined) => {
    if (!next) return;
    setFile(next); setResult(null); setError("");
  };
  const onInput = (event: ChangeEvent<HTMLInputElement>) => choose(event.target.files?.[0]);
  const onDrop = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); setDragging(false); choose(event.dataTransfer.files[0]); };

  async function processFile() {
    if (!file) return;
    setBusy(true); setError("");
    try {
      const form = new FormData(); form.append("file", file);
      const response = await fetch("/api/process", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "처리 중 오류가 발생했습니다.");
      setResult(data);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "처리 중 오류가 발생했습니다."); }
    finally { setBusy(false); }
  }

  return <main className="page"><div className="shell">
    <header className="topbar"><div className="brand"><span className="brand-mark">✦</span> 회의록 정리기</div><span className="pill">GEMINI POWERED</span></header>
    <section><p className="eyebrow">MEETING NOTES, MADE SIMPLE</p><h1>녹취를 올리면<br />회의의 흐름이 보입니다.</h1><p className="lede">오디오를 받아쓰고, 긴 대화를 핵심 요약·결정사항·할 일로 나눠 한눈에 정리해 드립니다.</p></section>
    <section className="upload-card">
      <div className={`dropzone ${dragging ? "active" : ""}`} onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop}>
        <div className="upload-icon">↑</div><strong>{file ? file.name : "녹취 파일을 여기에 놓으세요"}</strong>
        <p>{file ? "파일이 준비되었습니다. 정리를 시작해 보세요." : "오디오(mp3, wav, m4a, webm) 또는 TXT·MD"}</p>
        <label className="file-button">파일 찾아보기<input type="file" accept="audio/*,.txt,.md" onChange={onInput} /></label>
      </div>
      {file && <div className="file-name"><span>{file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB</span><button onClick={() => setFile(null)}>삭제</button></div>}
      {file && <button className="primary" style={{ width: "100%", marginTop: 16 }} onClick={processFile} disabled={busy}>{busy ? "회의록을 정리하고 있어요…" : "회의록 정리하기 →"}</button>}
      {error && <div className="error">{error}</div>}
    </section>
    <section className="results"><div className="results-header"><h2>정리된 회의록</h2><span className="status">{result ? result.filename : "파일을 업로드하면 결과가 여기에 나타납니다"}</span></div>
      {!result ? <div className="empty">아직 정리된 회의록이 없습니다.<br />녹취 파일을 올려 시작해 보세요.</div> : <div className="grid">
        <article className="result-card wide"><span className="pill">TRANSCRIPT</span><h3>받아쓰기</h3><p style={{ whiteSpace: "pre-wrap" }}>{result.transcript}</p></article>
        <article className="result-card"><span className="pill">SUMMARY</span><h3>핵심 요약</h3><p>{result.summary}</p></article>
        <article className="result-card"><span className="pill">DECISIONS</span><h3>결정사항</h3>{result.decisions.length ? <ul>{result.decisions.map((item, i) => <li key={i}>{item}</li>)}</ul> : <p>확인된 결정사항이 없습니다.</p>}</article>
        <article className="result-card wide"><span className="pill">ACTION ITEMS</span><h3>할 일</h3>{result.actionItems.length ? <ul>{result.actionItems.map((item, i) => <li key={i}>{item}</li>)}</ul> : <p>확인된 할 일이 없습니다.</p>}</article>
      </div>}
    </section><footer>업로드한 파일은 회의록 처리에만 사용됩니다. API 키는 서버에서만 관리하세요.</footer>
  </div></main>;
}
