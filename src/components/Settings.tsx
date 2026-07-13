import React, { useState, useEffect } from 'react';
import { ShieldCheck, Mail, KeyRound, Smartphone, CheckCircle2, AlertCircle, RefreshCw, Lock, Sparkles, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchWithAuth } from '../utils/apiClient';

export default function Settings() {
  const { user } = useAuth();

  // Password Change States
  const [step, setStep] = useState<'idle' | 'code_sent'>('idle');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);
  const [loadingCode, setLoadingCode] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleRequestCode = async () => {
    setLoadingCode(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await fetchWithAuth('/api/auth/request-password-change', {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Error al solicitar el código de verificación.');
      }

      setStep('code_sent');
      setSuccessMessage(data.message || 'Código enviado a tu correo.');
      if (data.dev_code) {
        setDevCode(data.dev_code);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'No se pudo enviar el código.');
    } finally {
      setLoadingCode(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (newPassword.length < 8) {
      setErrorMessage('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden.');
      return;
    }

    setLoadingSubmit(true);
    try {
      const res = await fetchWithAuth('/api/auth/verify-and-change-password', {
        method: 'POST',
        body: JSON.stringify({
          code,
          new_password: newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Error al actualizar la contraseña.');
      }

      setSuccessMessage('¡Contraseña actualizada exitosamente!');
      setCode('');
      setNewPassword('');
      setConfirmPassword('');
      setStep('idle');
      setDevCode(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'No se pudo actualizar la contraseña.');
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      alert(
        'Para instalar en móvil:\n\n• En iOS (Safari): Toca el botón de Compartir y selecciona "Añadir a la pantalla de inicio".\n• En Android (Chrome): Toca los 3 puntos del menú superior y selecciona "Instalar aplicación".'
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Configuraciones</h1>
        <p className="text-sm text-gray-400 mt-1">
          Administra la seguridad de tu cuenta, perfil e instalación en dispositivos móviles.
        </p>
      </div>

      {/* Account Info Card */}
      <div className="bg-black/80 backdrop-blur-md rounded-2xl border border-white/10 p-5 sm:p-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white">Perfil de Usuario</h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Verificado
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400 mt-1">
              <Mail className="w-3.5 h-3.5 text-gray-500" />
              <span>{user?.email || 'Usuario conectado'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Security & Password Change Card */}
      <div className="bg-black/80 backdrop-blur-md rounded-2xl border border-white/10 p-5 sm:p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Cambiar Contraseña</h3>
              <p className="text-xs text-gray-400">
                Enviaremos un código temporal de 6 dígitos a tu correo de verificación.
              </p>
            </div>
          </div>

          <button
            onClick={handleRequestCode}
            disabled={loadingCode}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs sm:text-sm transition-all shadow-md shadow-emerald-500/10 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loadingCode ? 'animate-spin' : ''}`} />
            <span>{step === 'code_sent' ? 'Reenviar Código' : 'Solicitar Código por Correo'}</span>
          </button>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs sm:text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs sm:text-sm">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {devCode && (
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>Código temporal de verificación:</span>
            </div>
            <strong className="font-mono text-base tracking-widest bg-blue-500/20 px-3 py-1 rounded-lg text-white">
              {devCode}
            </strong>
          </div>
        )}

        {step === 'code_sent' && (
          <form onSubmit={handleChangePassword} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  Código de 6 dígitos
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="Ej: 849103"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="Mínimo 8 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  Confirmar Contraseña
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="Repetir nueva contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep('idle')}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs sm:text-sm font-medium text-gray-300 border border-white/10 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loadingSubmit}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs sm:text-sm hover:from-emerald-400 hover:to-teal-400 transition-all shadow-lg shadow-emerald-500/15 disabled:opacity-50"
              >
                <Lock className="w-4 h-4" />
                <span>{loadingSubmit ? 'Actualizando...' : 'Confirmar Cambio de Contraseña'}</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* PWA Mobile Application Card */}
      <div className="bg-black/80 backdrop-blur-md rounded-2xl border border-white/10 p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 flex-shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">Aplicación Móvil (PWA)</h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-purple-500/15 text-purple-300 border border-purple-500/30">
                  Instalable
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-xl">
                SmartInvest está adaptada como Progressive Web App. Puedes agregarla a la pantalla de inicio de tu teléfono para acceder a pantalla completa sin la barra del navegador.
              </p>
            </div>
          </div>

          <button
            onClick={handleInstallPWA}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs sm:text-sm border border-white/15 transition-all flex-shrink-0"
          >
            <Download className="w-4 h-4 text-purple-400" />
            <span>Instalar como App</span>
          </button>
        </div>
      </div>
    </div>
  );
}
