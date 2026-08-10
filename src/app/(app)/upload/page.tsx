"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { uploadApi } from "@/lib/api/services";
import { getErrorMessage } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<{
    url: string;
    key: string;
    contentType?: string;
  } | null>(null);
  const [presignKey, setPresignKey] = useState("");
  const [mimeType, setMimeType] = useState("audio/mpeg");
  const [presign, setPresign] = useState<unknown>(null);

  const upload = useMutation({
    mutationFn: () => {
      if (!file) throw new Error("Chọn file");
      return uploadApi.upload(file);
    },
    onSuccess: (data) => {
      setResult(data);
      toast.success("Upload thành công");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const remove = useMutation({
    mutationFn: () => {
      if (!result?.key) throw new Error("Không có key");
      return uploadApi.remove(result.key);
    },
    onSuccess: () => {
      toast.success("Đã xoá");
      setResult(null);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const getPresign = useMutation({
    mutationFn: () => uploadApi.presign(presignKey, mimeType),
    onSuccess: (data) => {
      setPresign(data);
      toast.success("Đã lấy presign URL");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Upload</h1>
        <p className="text-sm text-muted">
          Upload file lên Cloudflare R2 (ảnh, audio, video, PDF ≤ 50MB).
        </p>
      </div>

      <Card className="space-y-3">
        <CardTitle className="text-base">Upload file</CardTitle>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm"
        />
        <Button
          loading={upload.isPending}
          disabled={!file}
          onClick={() => upload.mutate()}
        >
          Upload
        </Button>
        {result ? (
          <div className="space-y-2 rounded-md bg-surface p-3 text-sm">
            <div>
              URL:{" "}
              <a
                href={result.url}
                target="_blank"
                rel="noreferrer"
                className="break-all text-primary underline"
              >
                {result.url}
              </a>
            </div>
            <div className="text-muted">Key: {result.key}</div>
            <Button
              size="sm"
              variant="danger"
              loading={remove.isPending}
              onClick={() => remove.mutate()}
            >
              Xoá file
            </Button>
          </div>
        ) : null}
      </Card>

      <Card className="space-y-3">
        <CardTitle className="text-base">Presigned URL</CardTitle>
        <Input
          label="Key"
          value={presignKey}
          onChange={(e) => setPresignKey(e.target.value)}
          placeholder="uploads/demo.mp3"
        />
        <Input
          label="MIME type"
          value={mimeType}
          onChange={(e) => setMimeType(e.target.value)}
        />
        <Button
          loading={getPresign.isPending}
          disabled={!presignKey.trim()}
          onClick={() => getPresign.mutate()}
        >
          Lấy URL
        </Button>
        {presign ? (
          <pre className="overflow-auto text-xs">
            {JSON.stringify(presign, null, 2)}
          </pre>
        ) : null}
      </Card>
    </div>
  );
}
