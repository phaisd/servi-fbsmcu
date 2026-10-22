"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Sparkles,
  KeyRound,
  ExternalLink,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Globe2,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LiyonCard, LiyonField, LiyonSelect } from "@/shared/components/liyon";
import type { GeminiSettings } from "@/features/identity";
import { testGeminiApiKeyAction } from "@/features/identity/actions";

interface GeminiSettingsTabProps {
  gemini: GeminiSettings;
  errors: Record<string, string[]>;
  onChange: (patch: GeminiSettings) => void;
}

const AVAILABLE_MODELS = [
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash (แนะนำ)",
    description: "รุ่นใหม่ล่าสุด มีความเร็วสูง ความแม่นยำสูง เหมาะสำหรับการแปลและเรียบเรียงข่าว",
  },
  {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    description: "โมเดลรุ่นใหม่ ตอบสนองรวดเร็วและใช้โทเค็นอย่างมีประสิทธิภาพ",
  },
  {
    id: "gemini-1.5-flash",
    name: "Gemini 1.5 Flash",
    description: "โมเดลมาตรฐาน มีความเสถียรและประหยัดการประมวลผล",
  },
  {
    id: "gemini-1.5-pro",
    name: "Gemini 1.5 Pro",
    description: "โมเดลขนาดใหญ่ ความสามารถวิเคราะห์และเรียบเรียงขั้นสูง",
  },
];

export function GeminiSettingsTab({ gemini, errors, onChange }: GeminiSettingsTabProps) {
  const [showKey, setShowKey] = useState(false);
  const [isTesting, startTesting] = useTransition();
  const [testStatus, setTestStatus] = useState<null | {
    ok: boolean;
    message: string;
  }>(null);

  function updateField<K extends keyof GeminiSettings>(key: K, value: GeminiSettings[K]) {
    onChange({
      ...gemini,
      [key]: value,
    });
    setTestStatus(null);
  }

  function handleTestConnection() {
    if (!gemini.apiKey?.trim()) {
      toast.error("กรุณากรอก Gemini API Key ก่อนทำการทดสอบ");
      return;
    }

    startTesting(async () => {
      setTestStatus(null);
      const res = await testGeminiApiKeyAction({
        apiKey: gemini.apiKey.trim(),
        model: gemini.model,
      });

      if (!res.ok) {
        const errorMsg =
          (res.error.fieldErrors && Object.values(res.error.fieldErrors).flat()[0]) ||
          res.error.message ||
          "เชื่อมต่อ Gemini API ไม่สำเร็จ";
        setTestStatus({ ok: false, message: errorMsg });
        toast.error(errorMsg, { duration: 6000 });
        return;
      }

      setTestStatus({ ok: true, message: res.data.message });
      toast.success(res.data.message, { duration: 5000 });
    });
  }

  return (
    <div className="space-y-6">
      {/* 1. ข้อมูลภาพรวม & API Key */}
      <LiyonCard>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-amber-500 dark:text-amber-400" />
          <h2 className="text-lg font-bold text-foreground">การเชื่อมต่อ Google Gemini API</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          กำหนดค่า API Key เพื่อเปิดใช้งานระบบปัญญาประดิษฐ์ (AI) ในการแปลและเรียบเรียงข่าวสาร 2 ภาษา (ไทย-อังกฤษ) อัตโนมัติ
        </p>

        {/* Info Banner */}
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 mb-5 text-sm text-amber-900 dark:text-amber-200 space-y-2">
          <div className="flex items-center gap-2 font-semibold">
            <Cpu className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>ความสามารถ AI ในระบบขณะนี้:</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-xs opacity-90 pl-1">
            <li>
              <strong>แปลข่าวสาร 2 ภาษาในคลิกเดียว:</strong> ในหน้าจัดการข่าวสาร (News Admin) สามารถกดปุ่ม{" "}
              <em>&quot;✨ แปลงเป็นภาษาอังกฤษด้วย Gemini AI&quot;</em> เพื่อสร้างหัวข้อ คำโปรย และเนื้อหาฉบับภาษาอังกฤษอัตโนมัติ
            </li>
            <li>
              <strong>สำนวนภาษาอังกฤษเชิงวิชาการ:</strong> AI ถูกตั้งค่าให้อนุรักษ์ศัพท์แสงทางพระพุทธศาสนาและชื่อหลักสูตรให้ถูกต้องตามมาตรฐาน มจร
            </li>
          </ul>
        </div>

        <div className="space-y-5">
          {/* ช่องกรอก API Key */}
          <LiyonField
            label="Gemini API Key"
            htmlFor="gemini-api-key"
            error={errors["gemini.apiKey"]?.[0]}
            hint="ระบุ Google Gemini API Key ที่ได้จาก Google AI Studio"
          >
            <div className="relative">
              <input
                id="gemini-api-key"
                type={showKey ? "text" : "password"}
                value={gemini.apiKey}
                onChange={(e) => updateField("apiKey", e.target.value)}
                placeholder="AIzaSy..."
                className="w-full rounded-md border border-input bg-background pl-9 pr-10 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
                title={showKey ? "ซ่อนรหัส" : "แสดงรหัส"}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="mt-1.5 text-xs text-muted-foreground">
              ยังไม่มี API Key? ขอรับได้ฟรีที่{" "}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
              >
                Google AI Studio <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </LiyonField>

          {/* เลือกโมเดล AI */}
          <LiyonField
            label="โมเดลปัญญาประดิษฐ์ (AI Model)"
            htmlFor="gemini-model"
            error={errors["gemini.model"]?.[0]}
            hint="เลือกรุ่นโมเดลที่ต้องการใช้งาน แนะนำ Gemini 2.5 Flash เพื่อความรวดเร็วและแม่นยำสูง"
          >
            <LiyonSelect
              id="gemini-model"
              value={gemini.model}
              onChange={(e) => updateField("model", e.target.value)}
            >
              {AVAILABLE_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </LiyonSelect>
          </LiyonField>

          {/* รายละเอียดโมเดลที่เลือก */}
          <div className="text-xs text-muted-foreground bg-muted/30 rounded p-3 border border-border/50">
            {AVAILABLE_MODELS.find((m) => m.id === gemini.model)?.description ||
              "โมเดลประมวลผลข้อความจาก Google"}
          </div>

          {/* ปุ่มทดสอบการเชื่อมต่อ */}
          <div className="pt-3 border-t border-[var(--glass-border)] flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={isTesting || !gemini.apiKey?.trim()}
              onClick={handleTestConnection}
              className="gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              {isTesting ? "กำลังตรวจสอบการเชื่อมต่อ..." : "ทดสอบการเชื่อมต่อ API (Test Connection)"}
            </Button>

            {testStatus && (
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium ${
                  testStatus.ok
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    : "bg-destructive/10 text-destructive border border-destructive/20"
                }`}
              >
                {testStatus.ok ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{testStatus.message}</span>
              </div>
            )}
          </div>
        </div>
      </LiyonCard>

      {/* 2. การนำไปใช้งานในโมดูลต่าง ๆ */}
      <LiyonCard>
        <h2 className="text-base font-bold text-foreground mb-1">จุดการใช้งาน AI ภายในระบบ</h2>
        <p className="text-sm text-muted-foreground mb-4">
          เมื่อกำหนด API Key เรียบร้อยแล้ว ท่านสามารถใช้งานฟังก์ชัน AI ในจุดต่าง ๆ ได้ดังนี้
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg border border-border/60 bg-muted/20 flex gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0 h-fit">
              <Globe2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-foreground">ระบบข่าวสาร 2 ภาษา (Bilingual News)</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                ในหน้าจัดการข่าวสาร (News Admin) เมื่อกรอกข่าวภาษาไทย สามารถกดปุ่มให้ AI
                ช่วยร่างและแปลเป็นภาษาอังกฤษได้ทันที ทั้งหัวข้อ คำโปรย และเนื้อหาเต็ม
              </p>
            </div>
          </div>

          <div className="p-4 rounded-lg border border-border/60 bg-muted/20 flex gap-3">
            <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0 h-fit">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-foreground">ร่างคำโปรยและสรุปสาระสำคัญ</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                ระบบจะวิเคราะห์เนื้อหาภาษาไทยและสรุปใจความสำคัญ (Summary)
                ที่มีความกระชับเหมาะสมกับการแสดงผลบนหน้าการ์ดข่าวสารของ Portal
              </p>
            </div>
          </div>
        </div>
      </LiyonCard>
    </div>
  );
}
