import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold text-slate-900">
            Creator Platform へようこそ
          </CardTitle>
          <CardDescription className="text-slate-600">
            クリエイターのためのプラットフォームです
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button asChild className="w-full" size="lg">
            <Link href="/login">ログイン</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="w-full bg-transparent"
            size="lg"
          >
            <Link href="/register">新規登録</Link>
          </Button>
          <Button asChild variant="secondary" className="w-full" size="lg">
            <Link href="/posts">投稿を見る</Link>
          </Button>
          <Button asChild variant="ghost" className="w-full" size="lg">
            <Link href="/test">API テスト</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
