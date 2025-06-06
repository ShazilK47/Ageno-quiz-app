"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { handleFirebaseError } from "@/firebase/utils";

interface ImageUploaderProps {
  questionId: string;
  initialImageUrl?: string;
  onImageUpload: (questionId: string, imageUrl: string) => void;
  onImageRemove: (questionId: string) => void;
}

export default function ImageUploader({
  questionId,
  initialImageUrl,
  onImageUpload,
  onImageRemove,
}: ImageUploaderProps) {
  const [imageUrl, setImageUrl] = useState<string | undefined>(initialImageUrl);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setImageUrl(initialImageUrl);
  }, [initialImageUrl]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file (PNG, JPG, GIF)");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB");
      return;
    }

    setError(null);
    uploadImage(file);
  };

  const uploadImage = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const storage = getStorage();
      const timestamp = new Date().getTime();
      const storageRef = ref(storage, `quiz-images/${questionId}_${timestamp}`);

      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          const formattedError = handleFirebaseError(error);
          setError(formattedError.message);
          setIsUploading(false);
        },
        async () => {
          // Upload completed successfully
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          setImageUrl(downloadUrl);
          onImageUpload(questionId, downloadUrl);
          setIsUploading(false);
        }
      );
    } catch (err) {
      const formattedError = handleFirebaseError(err);
      setError(formattedError.message);
      setIsUploading(false);
    }
  };

  const removeImage = async () => {
    if (!imageUrl) return;

    try {
      // Extract the path from the URL
      const storage = getStorage();
      const urlPath = imageUrl.split("?")[0];
      const pathWithoutOrigin = urlPath.split(".com/o/")[1];
      const decodedPath = decodeURIComponent(pathWithoutOrigin);
      const storageRef = ref(storage, decodedPath);

      await deleteObject(storageRef);

      setImageUrl(undefined);
      onImageRemove(questionId);
    } catch (err) {
      const formattedError = handleFirebaseError(err);
      setError(formattedError.message);
      // Still remove from UI even if there's an error deleting the file
      // (The file might not exist on storage anymore)
      setImageUrl(undefined);
      onImageRemove(questionId);
    }
  };

  return (
    <div className="mt-4 mb-4">
      <label className="block text-sm font-medium mb-2">
        Question Image (Optional)
      </label>

      {imageUrl ? (
        <div className="relative">
          <Image
            src={imageUrl}
            alt="Question"
            className="max-h-64 rounded-md border border-gray-200"
            width={300}
            height={200}
          />
          <button
            type="button"
            onClick={removeImage}
            className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700"
            title="Remove image"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
          {isUploading ? (
            <div>
              <div className="mb-2 text-sm text-gray-500">
                Uploading... {Math.round(uploadProgress)}%
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-purple-600 h-2.5 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          ) : (
            <>
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 text-sm font-medium text-purple-700 bg-purple-100 rounded-md hover:bg-purple-200"
                >
                  Upload Image
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                PNG, JPG, GIF up to 5MB
              </p>
            </>
          )}
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
