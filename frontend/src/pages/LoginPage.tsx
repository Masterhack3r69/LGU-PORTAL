import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
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
import { LoginBackground } from "@/components/ui/login-background";
import { showToast } from "@/lib/toast";

export function LoginPage() {
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!credentials.username || !credentials.password) {
      showToast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      await login(credentials);
      showToast.success("Login successful");
    } catch (error) {
      console.error("Login error:", error);
      // showToast.error("Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange =
    (field: keyof typeof credentials) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setCredentials((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
    };

  return (
    <div className="min-h-screen flex items-center justify-center relative px-4 py-12 sm:px-6 lg:px-8">
      <LoginBackground />
      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            LGU Portal
          </h1>
        </div>

        <Card className="backdrop-blur-sm bg-white/95 shadow-xl border-0">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Welcome back</CardTitle>
            <CardDescription>
              Enter your credentials to access the LGU Portal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={credentials.username}
                    onChange={handleChange("username")}
                    required
                  />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={credentials.password}
                    onChange={handleChange("password")}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign in"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-gray-600">
          <p>For support, please contact your system administrator</p>
        </div>
      </div>
    </div>
  );
}
