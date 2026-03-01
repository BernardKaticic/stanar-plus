import { useState } from "react";
import { Building2, Mail, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const InputWithIcon = ({
  id,
  type,
  placeholder,
  value,
  onChange,
  required,
  minLength,
  icon: Icon,
  autoComplete,
}: {
  id: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  minLength?: number;
  icon: React.ComponentType<{ className?: string }>;
  autoComplete?: string;
}) => (
  <div className="relative">
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
      <Icon className="h-4 w-4" />
    </span>
    <Input
      id={id}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      minLength={minLength}
      autoComplete={autoComplete}
      className="pl-10"
    />
  </div>
);

const Auth = () => {
  const { signIn, signUp } = useAuth();
  const [loading, setLoading] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupFullName, setSignupFullName] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(loginEmail, loginPassword);

    if (error) {
      toast.error("Greška pri prijavi", {
        description:
          error.message === "Invalid login credentials" || error.message === "Invalid credentials"
            ? "Neispravni podaci za prijavu"
            : error.message,
      });
    } else {
      toast.success("Uspješno ste se prijavili");
    }

    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (signupPassword.length < 6) {
      toast.error("Lozinka mora imati najmanje 6 znakova");
      setLoading(false);
      return;
    }

    const { error } = await signUp(signupEmail, signupPassword, signupFullName);

    if (error) {
      if (
        error.message.toLowerCase().includes("već postoji") ||
        error.message.toLowerCase().includes("already")
      ) {
        toast.error("Korisnik s ovim emailom već postoji");
      } else {
        toast.error("Greška pri registraciji", {
          description: error.message,
        });
      }
    } else {
      toast.success("Uspješno ste se registrirali");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4 sm:p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <Building2 className="h-11 w-11 text-primary shrink-0" />
          <span className="text-2xl sm:text-3xl font-bold tracking-tight">STANAR PLUS</span>
        </div>

        <Card className="shadow-lg border-muted">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">Dobrodošli</CardTitle>
            <CardDescription>Prijavite se ili registrirajte svoj račun</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full min-w-0">
              <TabsList className="grid w-full min-w-0 grid-cols-2 h-10 mb-6 overflow-hidden">
                <TabsTrigger value="login" className="min-w-0 shrink">Prijava</TabsTrigger>
                <TabsTrigger value="signup" className="min-w-0 shrink">Registracija</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <InputWithIcon
                      id="login-email"
                      type="email"
                      placeholder="vas@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      icon={Mail}
                      autoComplete="email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Lozinka</Label>
                    <InputWithIcon
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      icon={Lock}
                      autoComplete="current-password"
                    />
                  </div>
                  <Button type="submit" className="w-full mt-2" disabled={loading}>
                    {loading ? "Prijava..." : "Prijavi se"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Puno ime</Label>
                    <InputWithIcon
                      id="signup-name"
                      type="text"
                      placeholder="Ime i prezime"
                      value={signupFullName}
                      onChange={(e) => setSignupFullName(e.target.value)}
                      required
                      icon={User}
                      autoComplete="name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <InputWithIcon
                      id="signup-email"
                      type="email"
                      placeholder="vas@email.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                      icon={Mail}
                      autoComplete="email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Lozinka</Label>
                    <InputWithIcon
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                      minLength={6}
                      icon={Lock}
                      autoComplete="new-password"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Lozinka mora imati najmanje 6 znakova
                    </p>
                  </div>
                  <Button type="submit" className="w-full mt-2" disabled={loading}>
                    {loading ? "Registracija..." : "Registriraj se"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Demo: admin@stanar.hr / admin123
        </p>
      </div>
    </div>
  );
};

export default Auth;
