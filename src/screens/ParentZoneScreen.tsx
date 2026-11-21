import { useRef, useState, type ChangeEvent } from 'react';
import { APP_VERSION } from '../app/version';
import { Mascot } from '../components/Mascot';
import { buildProfileReport } from '../state/report';
import { useGame } from '../state/GameProvider';
import { serializeSaveFile } from '../state/saveModel';

type Message = { kind: 'ok' | 'error'; text: string };

export function ParentZoneScreen() {
  const { save, goToStart, updateSettings, restoreSave, resetProgress } = useGame();
  const [selectedId, setSelectedId] = useState(save.profiles[0]?.id ?? '');
  const [message, setMessage] = useState<Message | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const fileInput = useRef<HTMLInputElement | null>(null);

  const profile = save.profiles.find((item) => item.id === selectedId) ?? save.profiles[0];
  const report = profile ? buildProfileReport(save, profile.id, Date.now()) : null;

  const handleBackup = () => {
    const raw = serializeSaveFile(save, APP_VERSION);
    const blob = new Blob([raw], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `petualangan-angka-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setMessage({ kind: 'ok', text: 'Backup diunduh. Simpan file JSON di tempat aman.' });
  };

  const handleRestore = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const raw = await file.text();
    const result = restoreSave(raw);
    setMessage(
      result.ok
        ? { kind: 'ok', text: 'Backup berhasil dipulihkan. Profil dan progres sudah kembali.' }
        : { kind: 'error', text: result.error ?? 'Backup tidak bisa dipulihkan.' },
    );
  };

  return (
    <main className="screen parent">
      <header className="parent__header">
        <div>
          <h1 className="parent__title">Zona Orang Tua</h1>
          <p className="parent__subtitle">Laporan belajar, batas waktu, dan backup progres.</p>
        </div>
        <button type="button" className="icon-btn" onClick={goToStart} aria-label="Tutup Zona Orang Tua">
          <span aria-hidden="true">✕</span>
        </button>
      </header>

      {save.profiles.length > 1 ? (
        <div className="parent__profiles" role="group" aria-label="Pilih profil">
          {save.profiles.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`limit-choice ${item.id === profile?.id ? 'limit-choice--active' : ''}`}
              onClick={() => setSelectedId(item.id)}
            >
              {item.name}
            </button>
          ))}
        </div>
      ) : null}

      {report && profile ? (
        <section className="parent__card" aria-label={`Laporan ${profile.name}`}>
          <div className="parent__card-head">
            <h2 className="section-title">Laporan {profile.name}</h2>
            <Mascot mood="idle" className="parent__mascot" />
          </div>

          <div className="report__stats">
            <div className="report__stat">
              <span className="report__value">{report.minutesThisWeek}</span>
              <span className="report__label">menit minggu ini</span>
            </div>
            <div className="report__stat">
              <span className="report__value">{report.sessionsThisWeek}</span>
              <span className="report__label">sesi</span>
            </div>
            <div className="report__stat">
              <span className="report__value">
                {Math.round(report.completedNaturallyRate * 100)}%
              </span>
              <span className="report__label">selesai natural</span>
            </div>
          </div>

          <ul className="skill-list">
            {report.skills.map((skill) => (
              <li key={skill.skillId} className="skill-row">
                <div className="skill-row__head">
                  <span>{skill.label}</span>
                  <span>
                    {skill.attempts === 0 ? 'Belum dilatih' : `${Math.round(skill.mastery * 100)}%`}
                  </span>
                </div>
                <div className="skill-bar" aria-hidden="true">
                  <span style={{ width: `${Math.round(skill.mastery * 100)}%` }} />
                </div>
                {skill.needsHelp ? <span className="skill-row__flag">Perlu dibantu</span> : null}
              </li>
            ))}
          </ul>

          <p className="parent__note">
            {report.needsHelp.length > 0
              ? `Kiko sarankan latih lagi: ${report.needsHelp.map((skill) => skill.label).join(', ')}.`
              : 'Semua skill terlihat baik. Cukup sedikit-sedikit setiap hari.'}
          </p>
        </section>
      ) : (
        <section className="parent__card">
          <p className="parent__note">Belum ada profil anak. Buat profil dari layar mulai.</p>
        </section>
      )}

      <section className="parent__card" aria-label="Pengaturan">
        <h2 className="section-title">Batas waktu & suara</h2>

        <div className="parent__row">
          <span className="parent__row-label">Batas waktu harian</span>
          <div className="limit-options" role="group" aria-label="Batas waktu harian">
            {[10, 15, 20, 30].map((minutes) => (
              <button
                key={minutes}
                type="button"
                className={`limit-choice ${
                  save.settings.dailyLimitMin === minutes ? 'limit-choice--active' : ''
                }`}
                aria-pressed={save.settings.dailyLimitMin === minutes}
                onClick={() => updateSettings({ dailyLimitMin: minutes })}
              >
                {minutes} mnt
              </button>
            ))}
          </div>
        </div>
        <p className="parent__note">
          Saat batas tercapai, Kiko menguap dan mengajak istirahat — bukan memblokir paksa.
        </p>

        <div className="toggle-list">
          <Toggle
            label="Suara & narator"
            checked={save.settings.sfxOn}
            onChange={(value) => updateSettings({ sfxOn: value })}
          />
          <Toggle
            label="Musik latar"
            checked={save.settings.musicOn}
            onChange={(value) => updateSettings({ musicOn: value })}
          />
          <Toggle
            label="Pengingat harian"
            checked={save.settings.reminderOn}
            onChange={(value) => updateSettings({ reminderOn: value })}
          />
        </div>
        <p className="parent__note">
          Musik latar dan pengingat lokal menyusul di build APK (F5); preferensi sudah tersimpan.
        </p>
      </section>

      <section className="parent__card" aria-label="Backup dan reset">
        <h2 className="section-title">Data & backup</h2>
        <div className="parent__actions">
          <button type="button" className="btn btn--primary" onClick={handleBackup}>
            Backup ke file
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => fileInput.current?.click()}>
            Restore dari file
          </button>
          <button type="button" className="btn btn--danger" onClick={() => setConfirmReset(true)}>
            Reset progres
          </button>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="file-input"
          onChange={handleRestore}
        />
        <p className="parent__note">
          Backup berisi semua profil, kartu, dan progres. Simpan file JSON di Drive/WhatsApp sendiri.
        </p>
        {message ? (
          <p
            className={`parent__message ${message.kind === 'error' ? 'parent__message--error' : ''}`}
            role="status"
          >
            {message.text}
          </p>
        ) : null}
      </section>

      <section className="parent__card" aria-label="Tentang aplikasi">
        <h2 className="section-title">Tentang aplikasi</h2>
        <p className="parent__note">
          <strong>Versi {APP_VERSION}</strong>
        </p>
        <p className="parent__note">
          Update manual: pasang APK baru dengan applicationId dan tanda tangan yang sama. Progres
          tetap utuh; tetap backup dulu sebelum update.
        </p>
        <p className="parent__note">Tanpa internet, tanpa iklan, dan tidak ada data anak yang dikirim.</p>
      </section>

      {confirmReset ? (
        <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="reset-title">
          <div className="overlay__card">
            <Mascot mood="thinking" className="overlay__mascot" />
            <h2 id="reset-title">Reset semua progres?</h2>
            <p>
              Semua profil, kartu, dan riwayat akan dihapus. Pengaturan orang tua tetap disimpan.
              Tindakan ini tidak bisa dibatalkan.
            </p>
            <div className="overlay__actions">
              <button type="button" className="btn btn--ghost" onClick={() => setConfirmReset(false)}>
                Batal
              </button>
              <button
                type="button"
                className="btn btn--danger"
                onClick={() => {
                  setConfirmReset(false);
                  resetProgress();
                }}
              >
                Ya, reset
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={`toggle ${checked ? 'toggle--on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className="toggle__track" aria-hidden="true">
        <span className="toggle__thumb" />
      </span>
      <span>{label}</span>
    </button>
  );
}
