"use client";

import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import mammoth from "mammoth";
import { pdfjs } from "react-pdf";
//import "react-pdf/dist/esm/Page/AnnotationLayer.css";
//import "react-pdf/dist/esm/Page/TextLayer.css";
import "./Upload.module.css";
// Setting workerSrc to load PDF worker from local pdfjs-dist
// NEED TO HAVE THIS IN THE PUBLIC
//dfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

interface UploadedFile {
  type: string;
  content: string;
  name: string;
  size: number;
}

interface UploadProps {
  onFilesSelected: (texts: string[]) => void;
}

const Upload: React.FC<UploadProps> = ({ onFilesSelected }) => {
  const [fileContents, setFileContents] = useState<UploadedFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<UploadedFile[]>([]);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const extractPdfText = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((item: any) => item.str).join(" ");
      text += pageText + " ";
    }
    return text;
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const contents = await Promise.all(
      acceptedFiles.map(async (file) => {
        const reader = new FileReader();
        const arrayBuffer = await new Promise<ArrayBuffer>(
          (resolve, reject) => {
            reader.onload = () => resolve(reader.result as ArrayBuffer);
            reader.onerror = (error) => reject(error);
            reader.readAsArrayBuffer(file);
          }
        );

        const contentType = file.type;

        if (contentType.startsWith("image/")) {
          const url = URL.createObjectURL(file);
          return {
            type: "image",
            content: url,
            name: file.name,
            size: file.size,
          };
        } else if (contentType.startsWith("text/")) {
          const text = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
            reader.readAsText(file);
          });
          return {
            type: "text",
            content: text,
            name: file.name,
            size: file.size,
          };
        } else if (contentType === "application/pdf") {
          const text = await extractPdfText(arrayBuffer);
          return {
            type: "pdf",
            content: text,
            name: file.name,
            size: file.size,
          };
        } else if (
          contentType ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ) {
          const result = await mammoth.extractRawText({ arrayBuffer });
          return {
            type: "doc",
            content: result.value,
            name: file.name,
            size: file.size,
          };
        }
        return {
          type: "unsupported",
          content: "Unsupported file type",
          name: file.name,
          size: file.size,
        };
      })
    );
    setFileContents(contents);
  }, []);

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  const handleFileRemove = (fileName: string) => {
    setFileContents((prevFiles) =>
      prevFiles.filter((file) => file.name !== fileName)
    );
    setSelectedFiles((prevSelectedFiles) =>
      prevSelectedFiles.filter((file) => file.name !== fileName)
    );
    onFilesSelected(
      selectedFiles
        .filter((file) => file.name !== fileName)
        .map((file) => file.content)
    );
  };

  const handleFileClick = (file: UploadedFile) => {
    const isSelected = selectedFiles.find((f) => f.name === file.name);
    const updatedSelectedFiles = isSelected
      ? selectedFiles.filter((f) => f.name !== file.name)
      : [...selectedFiles, file];
    setSelectedFiles(updatedSelectedFiles);
    onFilesSelected(updatedSelectedFiles.map((f) => f.content));
  };

  return (
    <div className="Upload">
      <div {...getRootProps()} className="dropzone">
        <input {...getInputProps()} />
        <p>Drag 'n' drop some files here, or click to select files</p>
      </div>

      <div className="file-list">
        {fileContents.map((file, index) => (
          <div
            key={index}
            className="file-item"
            onClick={() => handleFileClick(file)}
          >
            <div className="file-icon">
              {file.type === "image" && <span>🖼️</span>}
              {file.type === "text" && <span>📄</span>}
              {file.type === "pdf" && <span>📄</span>}
              {file.type === "doc" && <span>📄</span>}
              {file.type === "unsupported" && <span>❌</span>}
            </div>
            <div className="file-info">
              <p className="file-name">{file.name}</p>
              <p className="file-size">{(file.size / 1024).toFixed(2)} KB</p>
            </div>
            <button
              onClick={() => handleFileRemove(file.name)}
              className="remove-button"
            >
              ✖️
            </button>
          </div>
        ))}
      </div>

      {selectedFiles.length > 0 && (
        <div className="file-previews">
          {selectedFiles.map((file, index) => (
            <div key={index} className="file-preview">
              <h2>
                File Preview: {file.name}{" "}
                <button
                  onClick={() => handleFileRemove(file.name)}
                  className="remove-button"
                >
                  ✖️
                </button>
              </h2>
              {file.type === "image" && (
                <img src={file.content} alt={file.name} width="400" />
              )}
              {file.type === "text" && <pre>{file.content}</pre>}
              {file.type === "pdf" && <pre>{file.content}</pre>}
              {file.type === "doc" && <pre>{file.content}</pre>}
              {file.type === "unsupported" && <p>{file.content}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Upload;
