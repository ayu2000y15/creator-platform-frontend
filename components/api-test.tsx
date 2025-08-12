"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";

export default function ApiTest() {
  const [testResult, setTestResult] = useState<{
    status: "idle" | "loading" | "success" | "error";
    message: string;
    details?: any;
  }>({ status: "idle", message: "" });

  const testConnection = async () => {
    setTestResult({ status: "loading", message: "テスト中..." });

    try {
      const response = await api.get("/test");
      setTestResult({
        status: "success",
        message: "API接続成功！",
        details: response.data,
      });
    } catch (error: any) {
      console.error("API接続エラー:", error);
      setTestResult({
        status: "error",
        message: "API接続失敗",
        details: {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
        },
      });
    }
  };

  const testAuth = async () => {
    setTestResult({ status: "loading", message: "認証テスト中..." });

    try {
      const response = await api.get("/user");
      setTestResult({
        status: "success",
        message: "認証済みAPI接続成功！",
        details: response.data,
      });
    } catch (error: any) {
      setTestResult({
        status: "error",
        message: "認証が必要または失敗",
        details: {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
        },
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Laravel API 接続テスト</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={testConnection}
            disabled={testResult.status === "loading"}
          >
            基本接続テスト
          </Button>
          <Button
            onClick={testAuth}
            disabled={testResult.status === "loading"}
            variant="outline"
          >
            認証テスト
          </Button>
        </div>

        {testResult.status !== "idle" && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  testResult.status === "success"
                    ? "default"
                    : testResult.status === "error"
                    ? "destructive"
                    : "secondary"
                }
              >
                {testResult.status === "success"
                  ? "成功"
                  : testResult.status === "error"
                  ? "エラー"
                  : "実行中"}
              </Badge>
              <span>{testResult.message}</span>
            </div>

            {testResult.details && (
              <pre className="bg-muted p-3 rounded text-sm overflow-auto">
                {JSON.stringify(testResult.details, null, 2)}
              </pre>
            )}
          </div>
        )}

        <div className="text-sm text-muted-foreground space-y-1">
          <p>
            <strong>API URL:</strong> {process.env.NEXT_PUBLIC_API_URL}
          </p>
          <p>
            <strong>確認項目:</strong>
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Laravel サーバーが起動している (php artisan serve)</li>
            <li>CORS設定が正しい</li>
            <li>環境変数が設定されている</li>
            <li>ネットワークタブでリクエストを確認</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
