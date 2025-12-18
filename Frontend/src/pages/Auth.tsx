import React, { useEffect, useState } from 'react';
import { useAuthMachine } from '../hooks/useAuthMachine'; // The FSM Authority
import { AuthState } from '../types/auth'; // The Types
import { AUTH_COPY } from '../constants/authCopy'; // The Copy
import { BookOpen, AlertTriangle, Eye, EyeOff, CheckCircle2, GraduationCap, ArrowRight, ShieldCheck, Stars, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { evaluatePassword } from '../logic/passwordSecurity';
import { PasswordStrengthMeter } from '../components/auth/PasswordStrengthMeter';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// --- PATTERN PRIMITIVES (Rule 5 & 6) ---

interface MatchProps<S extends AuthState['status']> {
  status: S;
  render: (state: Extract<AuthState, { status: S }>) => React.ReactNode;
}

// The Matcher: Visual == Logical
function Match<S extends AuthState['status']>({ status, render }: MatchProps<S>) {
  return null; // Virtual component
}

interface AuthStateMachineProps {
  state: AuthState;
  children: React.ReactElement<MatchProps<any>> | React.ReactElement<MatchProps<any>>[];
}

function AuthStateMachine({ state, children }: AuthStateMachineProps) {
  const childrenArray = React.Children.toArray(children) as React.ReactElement<MatchProps<any>>[];
  const handler = childrenArray.find(child => child.props.status === state.status);

  if (!handler) {
    throw new Error(`CRITICAL UI VIOLATION: No handler for state ${state.status}`);
  }

  return <>{handler.props.render(state as any)}</>;
}

// --- SUB-COMPONENTS (Pure Functional Projections) ---

const LoginForm = ({ form, dispatch, priority, mode, error }: any) => {
  const isLogin = mode === 'LOGIN';
  const [showPassword, setShowPassword] = useState(false); // Local UI State

  // Intelligent Domain Detection
  const isStudentEmail = form.email?.includes('.edu') || form.email?.includes('.ac.in');

  // OMEGA PHASE 0: Real-time Evaluation
  const passwordFeedback = evaluatePassword(form.password || '');
  const isPasswordValid = isLogin ? true : passwordFeedback.isStrong; // Only enforce on Signup

  // Visual Password Border Logic
  const getPasswordBorderColor = () => {
    if (isLogin || !form.password) return "focus:ring-primary/20";
    if (passwordFeedback.score >= 4) return "border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500/20";
    if (passwordFeedback.score >= 2) return "border-amber-500 focus:border-amber-500 focus:ring-amber-500/20";
    return "border-destructive focus:border-destructive focus:ring-destructive/20";
  };

  return (
    <div className="w-full max-w-[380px] space-y-8 animate-in fade-in slide-in-from-left-4 duration-500 relative z-20">

      {/* 2. THE COGNITIVE TOGGLE (Segmented Pill) */}
      <div className="bg-muted/50 p-1 rounded-full grid grid-cols-2 mb-8 relative">
        <div
          className={cn(
            "absolute top-1 bottom-1 w-[calc(50%-4px)] bg-background rounded-full shadow-sm transition-all duration-300 ease-out",
            isLogin ? "left-1" : "left-[calc(50%+2px)]"
          )}
        />
        <button
          onClick={() => !isLogin && dispatch({ type: 'TOGGLE_MODE' })}
          className={cn("text-sm font-medium py-2 rounded-full relative z-10 transition-colors", isLogin ? "text-foreground" : "text-muted-foreground")}
        >
          Sign In
        </button>
        <button
          onClick={() => isLogin && dispatch({ type: 'TOGGLE_MODE' })}
          className={cn("text-sm font-medium py-2 rounded-full relative z-10 transition-colors", !isLogin ? "text-foreground" : "text-muted-foreground")}
        >
          Sign Up
        </button>
      </div>

      {/* Dynamic Header */}
      <div className="space-y-2 text-center">
        {isStudentEmail && (
          <Badge variant="outline" className="mb-2 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 animate-in zoom-in mx-auto">
            <GraduationCap className="w-3 h-3 mr-1" /> Student Verified
          </Badge>
        )}
        <h1 className="text-3xl font-display font-bold tracking-tight">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h1>
        <p className="text-muted-foreground">
          {isLogin ? 'Access your notes vault.' : 'Join the student network.'}
        </p>
      </div>

      {/* ... OMEGA ERROR HANDLING ... */}
      {error && (
        <div className="bg-destructive/5 text-destructive text-sm px-4 py-3 rounded-xl flex items-start gap-3 border border-destructive/10 animate-in shake">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-2 w-full">
            <div>
              <p className="font-semibold">Authentication Failed</p>
              <p className="opacity-90">{AUTH_COPY[error] || 'Please check your details.'}</p>
            </div>
            {/* 3. ACTIONABLE RECOVERY */}
            {error === 'ERROR_CREDENTIALS' && isLogin && (
              <Button
                variant="outline"
                size="sm"
                className="w-full h-8 bg-background/50 border-destructive/20 hover:bg-destructive/10 text-destructive-foreground"
                onClick={() => dispatch({ type: 'TOGGLE_MODE' })}
              >
                No account? Create one <UserPlus className="ml-2 w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ... Priority (Only if no error) ... */}
      {!error && isLogin && priority.reason && (
        <div className="bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs px-3 py-2 rounded-lg flex items-center gap-2 border border-blue-500/20 justify-center">
          <Stars className="w-3 h-3" />
          {AUTH_COPY[priority.reason]}
        </div>
      )}

      <div className="space-y-5">

        {/* RESTORED: Name Field (Signup Only) */}
        {!isLogin && (
          <div className="space-y-2 animate-in slide-in-from-top-2">
            <Label>Full Name</Label>
            <Input
              value={form.name || ''}
              onChange={(e: any) => dispatch({ type: 'INPUT_CHANGE', field: 'name', value: e.target.value })}
              placeholder="John Doe"
              className="h-12 bg-background/50 focus:bg-background transition-all focus:ring-2 focus:ring-primary/20"
            />
          </div>
        )}

        <div className="space-y-2 group">
          <Label className="group-focus-within:text-primary transition-colors">{AUTH_COPY.LBL_EMAIL}</Label>
          <div className="relative">
            <Input
              value={form.email}
              onChange={(e: any) => dispatch({ type: 'INPUT_CHANGE', field: 'email', value: e.target.value })}
              placeholder="name@example.com"
              className={cn(
                "h-12 px-4 transition-all focus:ring-2 focus:ring-primary/20",
                isStudentEmail && "border-emerald-500/50 focus:border-emerald-500 focus:ring-emerald-500/20 pr-10"
              )}
            />
            {isStudentEmail && (
              <CheckCircle2 className="absolute right-3 top-3.5 h-5 w-5 text-emerald-500 animate-in zoom-in" />
            )}
          </div>
        </div>

        {/* RESTORED: Password Field with OMEGA METER & TOGGLE */}
        <div className="space-y-2 group">
          <div className="flex items-center justify-between">
            <Label className="group-focus-within:text-primary transition-colors">{AUTH_COPY.LBL_PASS}</Label>
            {isLogin && (
              <Link to="/forgot-password">
                <Button variant="link" className="p-0 h-auto text-xs font-normal text-muted-foreground hover:text-primary">
                  {AUTH_COPY.BTN_FORGOT_PASS}
                </Button>
              </Link>
            )}
          </div>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              value={form.password || ''}
              className={cn("h-12 pr-10 transition-all focus:ring-2", getPasswordBorderColor())}
              onChange={(e: any) => dispatch({ type: 'INPUT_CHANGE', field: 'password', value: e.target.value })}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-muted-foreground hover:text-foreground"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
          {/* Phase 0: Visual Strength Truth (Signup Only) */}
          {!isLogin && form.password && (
            <div className="pt-1">
              <PasswordStrengthMeter feedback={passwordFeedback} />
            </div>
          )}
        </div>

        <Button
          className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
          disabled={!isLogin && !isPasswordValid} // UI Enforcement
          onClick={() => {
            // Redundant safeguard
            if (!isLogin && !isPasswordValid) return;
            dispatch({ type: 'SUBMIT_PASSWORD' });
          }}
        >
          {isLogin ? (
            <>Sign In <ArrowRight className="ml-2 h-4 w-4" /></>
          ) : (
            <>Create Free Account <ArrowRight className="ml-2 h-4 w-4" /></>
          )}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/60" /></div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-widest"><span className="bg-background px-2 text-muted-foreground/50">Or continue with</span></div>
        </div>

        <Button variant="outline" className="w-full h-12 font-medium hover:bg-muted/50" onClick={() => dispatch({ type: 'SUBMIT_GOOGLE' })}>
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Google
        </Button>

        {/* RESTORED: Terms (SECURE INTERNAL LINKS) */}
        {!isLogin && (
          <p className="text-[10px] text-center text-muted-foreground/60 px-4 leading-relaxed">
            {AUTH_COPY.TXT_TERMS_PREFIX}{' '}
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground transition-colors"
            >
              {AUTH_COPY.LBL_TERMS}
            </a>{' '}
            &{' '}
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground transition-colors"
            >
              {AUTH_COPY.LBL_PRIVACY}
            </a>.
          </p>
        )}
      </div>
    </div>
  );
};

const LoadingGate = ({ context }: { context: string }) => (
  <div className="flex flex-col items-center justify-center space-y-6 py-12 animate-in fade-in zoom-in-95 duration-300">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-primary/20 rounded-full" />
      <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
    <div className="text-center space-y-2">
      <h3 className="text-lg font-semibold">Verifying Credentials...</h3>
      <span className="text-sm text-muted-foreground">
        {context === 'GOOGLE' ? AUTH_COPY.TIME_SUB_GOOGLE : context === 'PASSWORD' ? AUTH_COPY.TIME_SUB_PASSWORD : AUTH_COPY.TIME_SUB_EMAIL}
      </span>
    </div>
  </div>
);

const ErrorCard = ({ state, dispatch }: any) => (
  <div className="w-full max-w-sm bg-destructive/5 border border-destructive/20 p-8 rounded-2xl text-center space-y-6 animate-in zoom-in-95">
    <div className="h-16 w-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
      <AlertTriangle className="w-8 h-8 text-destructive" />
    </div>
    <div>
      <h3 className="font-bold text-destructive text-lg mb-1">Authentication Failed</h3>
      <p className="text-sm text-muted-foreground">{AUTH_COPY[state.copyKey]}</p>
    </div>
    {state.canRetry && (
      <div className="space-y-3">
        <Button variant="secondary" className="w-full" onClick={() => dispatch({ type: 'RETRY' })}>
          Try Again
        </Button>
        {/* Smart Recovery in Error Card too */}
        {state.copyKey === 'ERROR_CREDENTIALS' && (
          <Button
            variant="ghost"
            className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => { dispatch({ type: 'RETRY' }); dispatch({ type: 'TOGGLE_MODE' }); }}
          >
            Create New Account
          </Button>
        )}
      </div>
    )}
  </div>
);

const SuccessGate = ({ state }: any) => (
  <div className="text-center space-y-6 animate-in zoom-in-95 duration-500">
    <div className="w-20 h-20 bg-green-500/10 text-green-600 rounded-full flex items-center justify-center mx-auto text-3xl border border-green-500/20 shadow-xl shadow-green-500/20 mb-4">
      <CheckCircle2 className="w-10 h-10" />
    </div>
    <div className="space-y-2">
      <h2 className="text-2xl font-bold">Welcome Home.</h2>
      <p className="text-sm text-muted-foreground">Secure connection established.</p>
    </div>
    <div className="py-2 px-4 bg-muted/50 rounded-full font-mono text-[10px] text-muted-foreground/60 inline-block">
      Session ID: {state.sessionId.substring(0, 12)}...
    </div>
  </div>
);

// --- MAIN COMPONENT (The Sandbox) ---

export default function Auth() {
  const { state, dispatch, priority } = useAuthMachine();

  const { user } = useAuth();
  const navigate = useNavigate();

  // Intelligent Auto-Redirect on Success
  useEffect(() => {
    if (state.status === 'SUCCESS') {
      const timer = setTimeout(() => {
        // GOD-LEVEL LOGIC: Check if user needs onboarding
        // If degree or university is missing, they are new or skipped setup
        if (user && (!user.degree || !user.university)) {
          console.log('[Auth] Redirecting to Onboarding (Incomplete Profile)');
          navigate('/onboarding');
        } else {
          console.log('[Auth] Redirecting to Browse (Profile Complete)');
          navigate('/browse');
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [state.status, user, navigate]);

  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-2">

      {/* LEFT PANEL: The Logic */}
      <div className="relative flex flex-col items-center justify-center p-8 bg-background z-10 overflow-hidden">

        {/* 1. MOBILE AMBIENT HEADER (The Fix) */}
        <div className="absolute top-0 inset-x-0 h-48 bg-gradient-to-b from-primary/10 to-transparent lg:hidden pointer-events-none" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 lg:hidden pointer-events-none" />

        <div className="w-full max-w-[400px] relative z-20">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8 lg:mb-12 justify-center lg:justify-start">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="font-display font-bold text-2xl tracking-tight">NoteSnap</span>
          </div>

          <AuthStateMachine state={state}>
            {/* IDLE */}
            <Match status="IDLE" render={(s) => <LoginForm form={s.form} dispatch={dispatch} priority={priority} mode={s.mode} error={s.error} />} />

            {/* SUBMITTING */}
            <Match status="SUBMITTING" render={(s) => <LoadingGate context={s.provider === 'EMAIL' ? 'PASSWORD' : s.provider} />} />

            {/* TIMEOUTS */}
            <Match status="TIMEOUT_VALIDATION" render={() => <ErrorCard state={{ copyKey: 'TIME_VAL', canRetry: true }} dispatch={dispatch} />} />
            <Match status="TIMEOUT_SUBMIT_EMAIL" render={() => <ErrorCard state={{ copyKey: 'TIME_SUB_EMAIL', canRetry: true }} dispatch={dispatch} />} />
            <Match status="TIMEOUT_SUBMIT_GOOGLE" render={() => <ErrorCard state={{ copyKey: 'TIME_SUB_GOOGLE', canRetry: true }} dispatch={dispatch} />} />
            <Match status="TIMEOUT_SUBMIT_PASSWORD" render={() => <ErrorCard state={{ copyKey: 'TIME_SUB_PASSWORD', canRetry: true }} dispatch={dispatch} />} />

            {/* SUCCESS */}
            <Match status="SUCCESS" render={(s) => <SuccessGate state={s} />} />

            {/* ERRORS */}
            <Match status="ERROR_NETWORK" render={(s) => <ErrorCard state={s} dispatch={dispatch} />} />
            <Match status="ERROR_CREDENTIALS" render={(s) => <ErrorCard state={s} dispatch={dispatch} />} />
            <Match status="ERROR_LOCKED" render={(s) => <ErrorCard state={s} dispatch={dispatch} />} />
            <Match status="ERROR_GOOGLE" render={(s) => <ErrorCard state={s} dispatch={dispatch} />} />
            <Match status="ERROR_PHONE" render={(s) => <ErrorCard state={s} dispatch={dispatch} />} />
          </AuthStateMachine>

          <div className="mt-12 text-center">
            <p className="text-xs text-muted-foreground/50">
              © {new Date().getFullYear()} NoteSnap Inc. Secure 256-bit Encryption.
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: The Magic (Visual Showcase) */}
      <div className="hidden lg:flex flex-col justify-between bg-slate-950 text-white relative overflow-hidden p-16">
        {/* Abstract Cyber Background */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 opacity-50" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>

        <div className="relative z-10">
          <Badge variant="outline" className="text-white/80 border-white/20 bg-white/5 backdrop-blur-md mb-8 py-1.5 px-3">
            <Stars className="w-3 h-3 mr-2" /> Voted #1 Student Platform
          </Badge>
          <h2 className="font-display text-5xl font-bold leading-tight mb-6">
            Your Grades,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Supercharged.</span>
          </h2>
          <p className="text-xl text-slate-400 max-w-md leading-relaxed">
            Join 50,000+ top students sharing premium notes, assignments, and exam prep material.
          </p>
        </div>

        <div className="relative z-10 grid gap-6">
          {/* Testimonial Card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl max-w-md transform transition-all hover:scale-[1.02] cursor-default">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 flex items-center justify-center font-bold text-white text-lg">A</div>
              <div>
                <h4 className="font-bold">Aryan Sharma</h4>
                <p className="text-xs text-white/60">IIT Delhi • Computer Science</p>
              </div>
              <div className="ml-auto flex gap-0.5">
                {[1, 2, 3, 4, 5].map(i => <Stars key={i} className="w-4 h-4 text-emerald-400 fill-current" />)}
              </div>
            </div>
            <p className="text-slate-200 italic leading-relaxed">
              "I found the exact notes I needed for my finals. NoteSnap is basically a cheat code for college."
            </p>
          </div>

          {/* Stats Strip */}
          <div className="flex items-center gap-8 text-slate-400 text-sm font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 100% Quality Checked
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Instant Access
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
