"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ReactCrop, { centerCrop, makeAspectCrop, type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

function cropKeAturanTengah(lebar: number, tinggi: number, aspect: number): Crop {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 90 }, aspect, lebar, tinggi),
    lebar,
    tinggi,
  );
}

async function potongJadiFile(image: HTMLImageElement, crop: PixelCrop, namaFile: string, tipeFile: string): Promise<File> {
  const canvas = document.createElement("canvas");
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = Math.round(crop.width * scaleX);
  canvas.height = Math.round(crop.height * scaleY);

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas tidak didukung.");

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error("Gagal memproses gambar."));
        resolve(new File([blob], namaFile, { type: tipeFile }));
      },
      tipeFile,
      0.92,
    );
  });
}

/**
 * Modal crop gambar sebelum upload — dipakai form Pengumuman admin supaya
 * hasil potongan sudah pas dengan rasio area tampil slideshow (aturan bisnis
 * F2: object-cover otomatis di slideshow sering memotong bagian penting dari
 * foto yang diunggah admin apa adanya, jadi admin sendiri yang menentukan
 * area crop-nya sebelum terkirim ke server).
 */
export function ImageCropModal({
  file,
  aspect,
  judul = "Sesuaikan Gambar",
  onCancel,
  onCropped,
}: {
  file: File;
  aspect: number;
  judul?: string;
  onCancel: () => void;
  onCropped: (file: File) => void;
}) {
  // Object URL diturunkan langsung dari `file` (bukan lewat setState di effect)
  // — effect di bawah cuma dipakai untuk membersihkannya saat `file` berganti/unmount.
  const src = useMemo(() => URL.createObjectURL(file), [file]);
  const [crop, setCrop] = useState<Crop>();
  const [pixelCrop, setPixelCrop] = useState<PixelCrop | null>(null);
  const [memproses, setMemproses] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    return () => URL.revokeObjectURL(src);
  }, [src]);

  async function terapkan() {
    if (!imgRef.current || !pixelCrop || pixelCrop.width === 0) return;
    setMemproses(true);
    try {
      const hasil = await potongJadiFile(imgRef.current, pixelCrop, file.name, file.type || "image/png");
      onCropped(hasil);
    } catch {
      setMemproses(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-4 dark:bg-slate-900">
        <p className="mb-3 text-sm font-semibold text-slate-800 dark:text-white">{judul}</p>

        <ReactCrop crop={crop} onChange={(_, percentCrop) => setCrop(percentCrop)} onComplete={(c) => setPixelCrop(c)} aspect={aspect}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={src}
            alt="Pratinjau crop"
            className="max-h-[60vh] w-full object-contain"
            onLoad={(e) => setCrop(cropKeAturanTengah(e.currentTarget.width, e.currentTarget.height, aspect))}
          />
        </ReactCrop>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={memproses}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={terapkan}
            disabled={memproses}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
          >
            {memproses ? "Memproses..." : "Terapkan Crop"}
          </button>
        </div>
      </div>
    </div>
  );
}
