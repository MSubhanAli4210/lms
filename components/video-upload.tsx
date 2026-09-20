"use client";

import { upload } from "@vercel/blob/client";
import {
  ChangeEvent,
  useRef,
  useState,
} from "react";

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB

const ALLOWED_TYPES = [
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
  "video/x-m4v",
];

type VideoUploadProps = {
  value?: string;
  onChange: (pathname: string) => void;
  disabled?: boolean;
};

export default function VideoUpload({
  value,
  onChange,
  disabled = false,
}: VideoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [uploading, setUploading] =
    useState(false);

  const [progress, setProgress] =
    useState(0);

  const [error, setError] =
    useState<string | null>(null);

  const [uploadedFileName, setUploadedFileName] =
    useState<string | null>(null);

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    setError(null);
    setProgress(0);

    const file = event.target.files?.[0];

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(
        "Invalid video format. Please upload MP4, WebM, OGG, MOV, or M4V."
      );

      event.target.value = "";
      setSelectedFile(null);

      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError(
        "Video is too large. Maximum file size is 500 MB."
      );

      event.target.value = "";
      setSelectedFile(null);

      return;
    }

    setSelectedFile(file);
  }

  async function handleUpload() {
    if (!selectedFile) {
      setError("Please select a video first.");
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setProgress(0);

      /*
       * Keep the pathname simple.
       *
       * Vercel Blob's server route will add
       * a random suffix, so duplicate filenames
       * won't overwrite each other.
       */
      const pathname = `videos/${selectedFile.name}`;

      const blob = await upload(
        pathname,
        selectedFile,
        {
          access: "private",

          handleUploadUrl:
            "/api/uploads/video",

          /*
           * Multipart uploads are recommended
           * for larger files.
           */
          multipart:
            selectedFile.size >
            100 * 1024 * 1024,

          onUploadProgress: ({
            percentage,
          }) => {
            setProgress(
              Math.round(percentage)
            );
          },
        }
      );

      /*
       * For a private Blob store, save the
       * pathname in your database rather than
       * exposing/storing a temporary delivery URL.
       *
       * Example:
       * videos/introduction-AbC123.mp4
       */
      onChange(blob.pathname);

      setUploadedFileName(
        selectedFile.name
      );

      setProgress(100);
      setSelectedFile(null);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    } catch (err) {
      console.error(
        "Video upload failed:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Video upload failed. Please try again."
      );
    } finally {
      setUploading(false);
    }
  }

  function handleRemove() {
    /*
     * This removes the video from the form.
     *
     * It does NOT delete the Blob itself.
     * Blob deletion should be handled
     * by a protected server API route.
     */
    onChange("");

    setSelectedFile(null);
    setUploadedFileName(null);
    setProgress(0);
    setError(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function formatFileSize(
    bytes: number
  ) {
    if (bytes === 0) {
      return "0 MB";
    }

    const mb =
      bytes / (1024 * 1024);

    if (mb < 1) {
      return `${(
        bytes / 1024
      ).toFixed(1)} KB`;
    }

    return `${mb.toFixed(1)} MB`;
  }

  return (
    <div className="space-y-4">
      {/* File input */}
      <div className="space-y-2">
        <label
          htmlFor="video-upload"
          className="block text-sm font-medium"
        >
          Lesson Video
        </label>

        <input
          ref={inputRef}
          id="video-upload"
          type="file"
          accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-m4v"
          onChange={handleFileChange}
          disabled={
            disabled || uploading
          }
          className="
            block
            w-full
            rounded-md
            border
            border-gray-300
            bg-white
            px-3
            py-2
            text-sm
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        />

        <p className="text-xs text-gray-500">
          MP4, WebM, OGG, MOV, or M4V.
          Maximum size: 500 MB.
        </p>
      </div>

      {/* Selected file */}
      {selectedFile &&
        !uploading && (
          <div
            className="
              rounded-md
              border
              border-gray-200
              bg-gray-50
              p-3
            "
          >
            <p className="text-sm font-medium">
              {
                selectedFile.name
              }
            </p>

            <p className="mt-1 text-xs text-gray-500">
              {formatFileSize(
                selectedFile.size
              )}
            </p>
          </div>
        )}

      {/* Upload progress */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>
              Uploading video...
            </span>

            <span>
              {progress}%
            </span>
          </div>

          <div
            className="
              h-2
              w-full
              overflow-hidden
              rounded-full
              bg-gray-200
            "
          >
            <div
              className="
                h-full
                bg-black
                transition-all
                duration-200
              "
              style={{
                width: `${progress}%`,
              }}
            />
          </div>

          <p className="text-xs text-gray-500">
            Do not close this page
            while your video is
            uploading.
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          className="
            rounded-md
            border
            border-red-200
            bg-red-50
            px-3
            py-2
            text-sm
            text-red-700
          "
        >
          {error}
        </div>
      )}

      {/* Upload button */}
      {selectedFile &&
        !uploading && (
          <button
            type="button"
            onClick={handleUpload}
            disabled={disabled}
            className="
              rounded-md
              bg-black
              px-4
              py-2
              text-sm
              font-medium
              text-white
              transition
              hover:bg-gray-800
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            Upload Video
          </button>
        )}

      {/* Current / uploaded video */}
      {value && !uploading && (
        <div
          className="
            rounded-md
            border
            border-green-200
            bg-green-50
            p-3
          "
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-green-800">
                Video uploaded
                successfully
              </p>

              {uploadedFileName && (
                <p className="mt-1 truncate text-xs text-green-700">
                  {
                    uploadedFileName
                  }
                </p>
              )}

              <p className="mt-1 break-all text-xs text-green-700">
                {value}
              </p>
            </div>

            <button
              type="button"
              onClick={
                handleRemove
              }
              disabled={disabled}
              className="
                shrink-0
                text-sm
                font-medium
                text-red-600
                hover:text-red-700
                disabled:opacity-50
              "
            >
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
