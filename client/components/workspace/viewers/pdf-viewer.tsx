import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Citation } from "@/lib/types";
import { useParams } from "next/navigation";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import { useSourceViewBlob } from "@/hooks/use-sources";

// Configure PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export function PDFViewer({ citation }: { citation: Citation }) {
  const { workspaceId } = useParams() as { workspaceId: string };
  const { data: pdfBlob, isLoading: loadingUrl, isError, error: queryError } = useSourceViewBlob(workspaceId, citation.sourceId);
  
  const error = isError ? (queryError as Error)?.message || "Failed to load PDF file" : null;

  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(citation.pageNumber ?? citation.page ?? 1);
  const [scale, setScale] = useState(1.0);

  // Update page number when citation changes
  useEffect(() => {
    if (citation.pageNumber) setPageNumber(citation.pageNumber);
    else if (citation.page) setPageNumber(citation.page);
  }, [citation.pageNumber, citation.page]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  return (
    <div className="flex h-full flex-col">
      {/* toolbar */}
      <div className="flex items-center justify-between border-b border-border bg-surface-2 px-3 py-2">
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7" 
            onClick={() => setPageNumber(p => Math.max(1, p - 1))}
            disabled={pageNumber <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-mono text-xs text-muted-foreground min-w-[70px] text-center">
            Page {pageNumber} / {numPages || '-'}
          </span>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7"
            onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
            disabled={pageNumber >= numPages && numPages > 0}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7"
            onClick={() => setScale(s => Math.max(0.5, s - 0.25))}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="font-mono text-xs text-muted-foreground w-12 text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7"
            onClick={() => setScale(s => Math.min(3, s + 0.25))}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* page */}
      <div className="flex-1 overflow-auto bg-muted p-6 flex justify-center">
        {loadingUrl ? (
          <div className="flex flex-col items-center justify-center text-muted-foreground mt-20">
            <Loader2 className="h-6 w-6 animate-spin mb-2" />
            <span className="text-sm">Loading secure source link...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center text-destructive mt-20">
            <AlertCircle className="h-6 w-6 mb-2" />
            <span className="text-sm">{error}</span>
          </div>
        ) : pdfBlob ? (
          <div className="shadow-sm border border-border">
            <Document
              file={pdfBlob}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={<Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto mt-20" />}
              error={<span className="text-sm text-destructive mt-20 block">Failed to load PDF file.</span>}
            >
              <Page 
                pageNumber={pageNumber} 
                scale={scale} 
                className="bg-white"
                renderTextLayer={true}
                renderAnnotationLayer={false}
              />
            </Document>
          </div>
        ) : null}
      </div>
    </div>
  );
}
