import { useState } from 'react';
import { Mascot } from '../components/Mascot';
import { ParentGate } from '../components/ParentGate';
import { useGame } from '../state/GameProvider';
import { AVATARS, type Profile } from '../state/saveModel';

export const AVATAR_EMOJI: Record<string, string> = {
  rubah: '🦊',
  kelinci: '🐰',
  panda: '🐼',
  katak: '🐸',
};

/**
 * Layar Mulai: pilih profil anak.
 * Anak 5 tahun tidak mengetik → orang tua yang membuat profil sekali di awal,
 * setelah itu anak hanya menekan kartu besar berisi avatar + namanya.
 */
export function StartScreen() {
  const { save, selectProfile, createProfile, openParentZone } = useGame();
  const hasProfiles = save.profiles.length > 0;
  const [showForm, setShowForm] = useState(!hasProfiles);
  const [showParentGate, setShowParentGate] = useState(false);
  const [name, setName] = useState('');
  const [avatarId, setAvatarId] = useState<string>(AVATARS[0]);
  const [ageGroup, setAgeGroup] = useState<Profile['ageGroup']>('5-6');

  const submitting = name.trim().length > 0;

  return (
    <main className="screen start">
      <header className="start__hero">
        <Mascot mood="happy" className="start__mascot" />
        <div>
          <h1 className="start__title">Petualangan Angka</h1>
          <p className="start__tagline">Hitung buah bareng Kiko si rubah</p>
        </div>
      </header>

      {hasProfiles ? (
        <section className="start__profiles" aria-label="Pilih profil anak">
          <h2 className="section-title">Siapa yang mau main?</h2>
          <div className="profiles">
            {save.profiles.map((profile) => (
              <button
                key={profile.id}
                type="button"
                className="profile-card"
                onClick={() => selectProfile(profile.id)}
              >
                <span className="profile-card__avatar" aria-hidden="true">
                  {AVATAR_EMOJI[profile.avatarId] ?? '🦊'}
                </span>
                <span className="profile-card__name">{profile.name}</span>
              </button>
            ))}
            {!showForm ? (
              <button type="button" className="profile-card profile-card--add" onClick={() => setShowForm(true)}>
                <span className="profile-card__avatar" aria-hidden="true">
                  ➕
                </span>
                <span className="profile-card__name">Anak lain</span>
              </button>
            ) : null}
          </div>
        </section>
      ) : null}

      {showForm ? (
        <form
          className="start__form"
          onSubmit={(event) => {
            event.preventDefault();
            if (!submitting) return;
            createProfile({ name: name.trim(), avatarId, ageGroup });
            setName('');
            setShowForm(false);
          }}
        >
          <h2 className="section-title">{hasProfiles ? 'Tambah anak' : 'Buat profil anak'}</h2>

          <label className="field">
            <span className="field__label">Nama anak</span>
            <input
              className="field__input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={16}
              placeholder="Misal: Aira"
              autoComplete="off"
              enterKeyHint="done"
            />
          </label>

          <fieldset className="avatar-grid">
            <legend className="field__label">Pilih avatar</legend>
            {AVATARS.map((avatar) => (
              <button
                key={avatar}
                type="button"
                className={`avatar-choice ${avatarId === avatar ? 'avatar-choice--active' : ''}`}
                aria-pressed={avatarId === avatar}
                onClick={() => setAvatarId(avatar)}
              >
                <span aria-hidden="true">{AVATAR_EMOJI[avatar]}</span>
              </button>
            ))}
          </fieldset>

          <div className="age-group" role="group" aria-label="Umur anak">
            {(['5-6', '7-8'] as const).map((group) => (
              <button
                key={group}
                type="button"
                className={`age-choice ${ageGroup === group ? 'age-choice--active' : ''}`}
                aria-pressed={ageGroup === group}
                onClick={() => setAgeGroup(group)}
              >
                {group === '5-6' ? '5–6 tahun' : '7–8 tahun'}
              </button>
            ))}
          </div>

          <div className="start__actions">
            <button type="submit" className="btn btn--primary" disabled={!submitting}>
              Mulai bermain
            </button>
            {hasProfiles ? (
              <button type="button" className="btn btn--ghost" onClick={() => setShowForm(false)}>
                Batal
              </button>
            ) : null}
          </div>
        </form>
      ) : null}

      <div className="start__footer">
        <p className="start__footnote">
          Setiap bab adalah petualangan baru. Yuk, lihat tantangan Kiko berikutnya!
        </p>
        <button
          type="button"
          className="btn btn--ghost btn--small"
          onClick={() => setShowParentGate(true)}
        >
          Orang tua
        </button>
      </div>

      {showParentGate ? (
        <ParentGate
          onSuccess={() => {
            setShowParentGate(false);
            openParentZone();
          }}
          onCancel={() => setShowParentGate(false)}
        />
      ) : null}
    </main>
  );
}
