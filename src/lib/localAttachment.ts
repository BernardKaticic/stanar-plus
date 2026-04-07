/** Prilog pohranjen lokalno (npr. localStorage) — samo za prototip; za produkciju koristiti backend. */

export type StoredAttachment = {
  fileName: string;
  mimeType: string;
  base64: string;
};

const DEFAULT_MAX_BYTES = 5 * 1024 * 1024; // 5 MB po datoteci

export function storedToBlob(a: StoredAttachment): Blob {
  const bin = atob(a.base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: a.mimeType || "application/octet-stream" });
}

export function downloadStored(a: StoredAttachment): void {
  const blob = storedToBlob(a);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = a.fileName || "dokument";
  link.click();
  URL.revokeObjectURL(url);
}

export function openStoredPreview(a: StoredAttachment): void {
  const blob = storedToBlob(a);
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function fileToStoredAttachment(
  file: File,
  maxBytes: number = DEFAULT_MAX_BYTES
): Promise<StoredAttachment> {
  if (file.size > maxBytes) {
    throw new Error(`Datoteka je prevelika (maks. ${Math.round(maxBytes / (1024 * 1024))} MB).`);
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const comma = dataUrl.indexOf(",");
      if (comma < 0) {
        reject(new Error("Neispravan format datoteke."));
        return;
      }
      const meta = dataUrl.slice(0, comma);
      const mimeMatch = meta.match(/^data:([^;]*)/);
      resolve({
        fileName: file.name,
        mimeType: mimeMatch?.[1]?.trim() || file.type || "application/octet-stream",
        base64: dataUrl.slice(comma + 1),
      });
    };
    reader.onerror = () => reject(new Error("Čitanje datoteke nije uspjelo."));
    reader.readAsDataURL(file);
  });
}
