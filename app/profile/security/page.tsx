"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { authApi } from "@/lib/auth-api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  ArrowLeft,
  Shield,
  Smartphone,
  Key,
  Copy,
  Check,
  Mail,
} from "lucide-react";

type TwoFactorMethod = "app" | "email";

export default function SecuritySettingsPage() {
  const { user, loading, enableTwoFactor, disableTwoFactor } = useAuth();
  const router = useRouter();

  const [isEnabling, setIsEnabling] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);
  const [twoFactorMethod, setTwoFactorMethod] =
    useState<TwoFactorMethod>("app");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState("");
  const [showSetup, setShowSetup] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success"
  );
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleEnableTwoFactor = async () => {
    setIsEnabling(true);
    setMessage("");

    try {
      if (user.two_factor_confirmed_at || user.email_two_factor_enabled) {
        // 既に何らかの二段階認証が有効な場合は無効にする
        if (user.two_factor_confirmed_at) {
          await authApi.disableTwoFactor();
        }
        if (user.email_two_factor_enabled) {
          await authApi.disableEmailTwoFactor();
        }
      }

      if (twoFactorMethod === "app") {
        // 認証アプリの場合の処理
        await enableTwoFactor();

        const [qrResponse, secretResponse, codesResponse] = await Promise.all([
          authApi.getTwoFactorQrCode(),
          authApi.getTwoFactorSecret(),
          authApi.getTwoFactorRecoveryCodes(),
        ]);

        setQrCode(qrResponse.svg);
        setSecret(secretResponse.secret);
        setBackupCodes(codesResponse.recovery_codes || []);
        setShowSetup(true);
        setMessage("認証アプリによる二段階認証の設定を開始しました。");
      } else {
        // メール認証の場合の処理
        await authApi.enableEmailTwoFactor();
        setMessage("メール認証による二段階認証を有効にしました。");
        setMessageType("success");
        // ユーザー情報を更新
        window.location.reload();
      }
      setMessageType("success");
    } catch (error: any) {
      console.error("Two-factor setup error:", error);
      setMessage(
        error.response?.data?.message || "二段階認証の有効化に失敗しました。"
      );
      setMessageType("error");
    } finally {
      setIsEnabling(false);
    }
  };

  const handleDisableTwoFactor = async () => {
    if (!confirm("二段階認証を無効にしますか？セキュリティが低下します。")) {
      return;
    }

    setIsDisabling(true);
    setMessage("");

    try {
      if (user.two_factor_confirmed_at) {
        await authApi.disableTwoFactor();
      }
      if (user.email_two_factor_enabled) {
        await authApi.disableEmailTwoFactor();
      }

      setShowSetup(false);
      setQrCode("");
      setSecret("");
      setBackupCodes([]);
      setMessage("二段階認証を無効にしました。");
      setMessageType("success");
      // ユーザー情報を更新
      window.location.reload();
    } catch (error: any) {
      console.error("Two-factor disable error:", error);
      setMessage(
        error.response?.data?.message || "二段階認証の無効化に失敗しました。"
      );
      setMessageType("error");
    } finally {
      setIsDisabling(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setMessage("6桁の認証コードを入力してください。");
      setMessageType("error");
      return;
    }

    setIsVerifying(true);
    setMessage("");

    try {
      await authApi.confirmTwoFactor({ code: verificationCode });

      setMessage("二段階認証が正常に設定されました！");
      setMessageType("success");
      setShowSetup(false);

      // ユーザー情報を更新
      window.location.reload();
    } catch (error: any) {
      console.error("Two-factor verification error:", error);

      let errorMessage = "認証コードの確認に失敗しました。";

      if (error.response?.status === 404) {
        errorMessage =
          "APIエンドポイントが見つかりません。Laravel側の実装を確認してください。";
      } else if (error.response?.status === 422) {
        errorMessage =
          error.response?.data?.message || "認証コードが正しくありません。";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = `エラー: ${error.message}`;
      }

      setMessage(errorMessage);
      setMessageType("error");
    } finally {
      setIsVerifying(false);
    }
  };

  const copyToClipboard = async (text: string, type: "secret" | "codes") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "secret") {
        setCopiedSecret(true);
        setTimeout(() => setCopiedSecret(false), 2000);
      } else {
        setCopiedCodes(true);
        setTimeout(() => setCopiedCodes(false), 2000);
      }
    } catch (error) {
      console.error("コピーに失敗しました:", error);
    }
  };

  // 認証状態を判定するロジック
  const isEmailActive = user.email_two_factor_enabled;
  const isAppActive =
    user.two_factor_confirmed_at && !user.email_two_factor_enabled;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push("/profile")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            プロフィールに戻る
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">セキュリティ設定</h1>
          <p className="text-gray-600 mt-1">
            アカウントのセキュリティを強化しましょう
          </p>
        </div>

        {message && (
          <Alert
            className={`mb-6 ${
              messageType === "error"
                ? "border-red-200 bg-red-50"
                : "border-green-200 bg-green-50"
            }`}
          >
            <AlertDescription
              className={
                messageType === "error" ? "text-red-800" : "text-green-800"
              }
            >
              {message}
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              二段階認証
            </CardTitle>
            <CardDescription>
              ログイン時に追加の認証コードを要求してセキュリティを強化します
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!showSetup ? (
              <div className="space-y-4">
                <div className="space-y-4">
                  <Label className="text-base font-medium">
                    認証方法を選択してください
                  </Label>
                  <RadioGroup
                    value={twoFactorMethod}
                    onValueChange={(value) =>
                      setTwoFactorMethod(value as TwoFactorMethod)
                    }
                  >
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value="app" id="app" />
                      <Label
                        htmlFor="app"
                        className="flex items-center gap-2 cursor-pointer flex-1"
                      >
                        <Smartphone className="h-4 w-4" />
                        <div>
                          <div className="font-medium">
                            認証アプリ
                            {isAppActive && (
                              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                現在有効
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            Google Authenticator等のアプリを使用
                          </div>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value="email" id="email" />
                      <Label
                        htmlFor="email"
                        className="flex items-center gap-2 cursor-pointer flex-1"
                      >
                        <Mail className="h-4 w-4" />
                        <div>
                          <div className="font-medium">
                            メール認証
                            {isEmailActive && (
                              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                現在有効
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            登録メールアドレスに認証コードを送信
                          </div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">二段階認証</h3>
                    <p className="text-sm text-gray-600">
                      {isEmailActive
                        ? "メール認証で有効"
                        : isAppActive
                        ? "認証アプリで有効"
                        : "無効"}
                    </p>
                  </div>
                  {isEmailActive || isAppActive ? (
                    <Button
                      variant="destructive"
                      onClick={handleDisableTwoFactor}
                      disabled={isDisabling}
                    >
                      {isDisabling ? "無効化中..." : "無効にする"}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleEnableTwoFactor}
                      disabled={isEnabling}
                    >
                      {isEnabling ? "設定中..." : "有効にする"}
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              twoFactorMethod === "app" && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">
                      認証アプリによる二段階認証の設定
                    </h3>

                    {/* ステップ1 */}
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Smartphone className="h-4 w-4" />
                        ステップ1: 認証アプリをダウンロード
                      </h4>
                      <p className="text-sm text-gray-600 mb-3">
                        以下のいずれかのアプリをスマートフォンにインストールしてください：
                      </p>
                      <ul className="text-sm text-gray-600 space-y-1 ml-4">
                        <li>• Google Authenticator（推奨）</li>
                        <li>• Microsoft Authenticator</li>
                        <li>• Authy</li>
                      </ul>
                    </div>

                    {/* ステップ2 */}
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2">
                        ステップ2: QRコードをスキャン
                      </h4>
                      {qrCode ? (
                        <div className="space-y-4">
                          <div className="bg-white p-4 rounded-lg border inline-block">
                            <div dangerouslySetInnerHTML={{ __html: qrCode }} />
                          </div>
                          <details>
                            <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                              QRコードが読み取れない場合はこちら
                            </summary>
                            <div className="mt-3 space-y-2">
                              <Label>手動入力用シークレットキー</Label>
                              <div className="flex gap-2">
                                <Input
                                  value={secret}
                                  readOnly
                                  className="font-mono text-sm"
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    copyToClipboard(secret, "secret")
                                  }
                                >
                                  {copiedSecret ? (
                                    <Check className="h-4 w-4" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                              <p className="text-xs text-gray-600">
                                認証アプリで手動でアカウントを追加し、上記のキーを入力してください。
                              </p>
                            </div>
                          </details>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600">
                          QRコードを読み込み中...
                        </p>
                      )}
                    </div>

                    {/* ステップ3 */}
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2">
                        ステップ3: 認証コードを入力
                      </h4>
                      <p className="text-sm text-gray-600 mb-3">
                        認証アプリに表示される6桁のコードを入力してください：
                      </p>
                      <div className="flex gap-2">
                        <Input
                          placeholder="123456"
                          value={verificationCode}
                          onChange={(e) =>
                            setVerificationCode(
                              e.target.value.replace(/\D/g, "").slice(0, 6)
                            )
                          }
                          maxLength={6}
                          className="max-w-32"
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                        />
                        <Button
                          onClick={handleVerifyCode}
                          disabled={
                            isVerifying || verificationCode.length !== 6
                          }
                        >
                          {isVerifying ? "確認中..." : "確認"}
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        コードは30秒ごとに更新されます。最新のコードを入力してください。
                      </p>
                    </div>

                    {/* バックアップコード */}
                    {backupCodes.length > 0 && (
                      <div className="border rounded-lg p-4 bg-yellow-50">
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <Key className="h-4 w-4" />
                          バックアップコード
                        </h4>
                        <p className="text-sm text-gray-600 mb-3">
                          認証アプリが使用できない場合に使用できるコードです。安全な場所に保存してください：
                        </p>
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          {backupCodes.map((code, index) => (
                            <code
                              key={index}
                              className="bg-white px-2 py-1 rounded text-sm border"
                            >
                              {code}
                            </code>
                          ))}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(backupCodes.join("\n"), "codes")
                          }
                        >
                          {copiedCodes ? (
                            <Check className="h-4 w-4 mr-2" />
                          ) : (
                            <Copy className="h-4 w-4 mr-2" />
                          )}
                          コードをコピー
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
