'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from './button';

import {
	AtSignIcon,
	ChevronLeftIcon,
	Grid2x2PlusIcon,
	InfoIcon,
	LogOutIcon,
	ShieldAlertIcon,
} from 'lucide-react';
import { Input } from './input';
import {
	buildProfile,
	clearProfile,
	initialsOf,
	loadProfile,
	saveProfile,
	validateProfile,
	type LocalProfile,
	type ProfileError,
} from '../../lib/profile';

/** Human-facing text for each validation failure the store can report. */
const ERROR_TEXT: Record<ProfileError, string> = {
	'name-empty': 'Enter a name to put on your profile.',
	'name-too-long': 'That name is too long to display neatly.',
	'email-invalid': 'That does not look like an email address.',
	'storage-unavailable':
		'This browser blocked local storage, so the profile cannot be saved.',
};

export function AuthPage() {
	// Read once on mount rather than in state: the profile is only ever replaced
	// by this component (create or sign out), so it cannot go stale underneath.
	const [profile, setProfile] = useState<LocalProfile | null>(() => loadProfile());
	const [displayName, setDisplayName] = useState('');
	const [email, setEmail] = useState('');
	const [error, setError] = useState<string | null>(null);

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();

		const problem = validateProfile({ displayName, email });
		if (problem) {
			setError(ERROR_TEXT[problem]);
			return;
		}

		const saved = saveProfile(buildProfile({ displayName, email }));
		if (!saved) {
			// Distinguish a blocked write from a validation problem -- retrying
			// the same input will never fix this one.
			setError(ERROR_TEXT['storage-unavailable']);
			return;
		}

		setError(null);
		setProfile(saved);
	}

	function handleSignOut() {
		clearProfile();
		setProfile(null);
		setDisplayName('');
		setEmail('');
		setError(null);
	}

	return (
		<main className="relative md:h-screen md:overflow-hidden lg:grid lg:grid-cols-2">
			<div className="bg-muted/60 relative hidden h-full flex-col border-r p-10 lg:flex">
				<div className="from-background absolute inset-0 z-10 bg-gradient-to-t to-transparent" />
				<div className="z-10 flex items-center gap-2">
					<Grid2x2PlusIcon className="size-6 text-primary" />
					<p className="font-heading text-xl font-bold tracking-wide">
						Nova
					</p>
				</div>
				<div className="z-10 mt-auto">
					<blockquote className="space-y-2">
						<p className="text-xl">
							&ldquo;One dashboard for academics, culture and training. Log it,
							watch the ranks move, ask Nova what to pick next.&rdquo;
						</p>
						<footer className="font-mono text-sm font-semibold text-muted-foreground">
							~ Project Nova
						</footer>
					</blockquote>
				</div>
				<div className="absolute inset-0">
					<FloatingPaths position={1} />
					<FloatingPaths position={-1} />
				</div>
			</div>
			<div className="relative flex min-h-screen flex-col justify-center p-4">
				<div
					aria-hidden
					className="absolute inset-0 isolate contain-strict -z-10 opacity-60"
				>
					<div className="bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,--theme(--color-foreground/.06)_0,hsla(0,0%,55%,.02)_50%,--theme(--color-foreground/.01)_80%)] absolute top-0 right-0 h-320 w-140 -translate-y-87.5 rounded-full" />
					<div className="bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)] absolute top-0 right-0 h-320 w-60 [translate:5%_-50%] rounded-full" />
					<div className="bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)] absolute top-0 right-0 h-320 w-60 -translate-y-87.5 rounded-full" />
				</div>
				<Button variant="ghost" className="absolute top-7 left-5" asChild>
					<a href="/">
						<ChevronLeftIcon className="size-4 me-2" />
						Home
					</a>
				</Button>
				<div className="mx-auto space-y-4 sm:w-sm">
					<div className="flex items-center gap-2 lg:hidden">
						<Grid2x2PlusIcon className="size-6 text-primary" />
						<p className="font-heading text-xl font-bold tracking-wide">
							Nova
						</p>
					</div>

					{profile ? (
						<ProfileSummary
							profile={profile}
							onSignOut={handleSignOut}
						/>
					) : (
						<>
							<div className="flex flex-col space-y-1">
								<h1 className="font-heading text-2xl font-bold tracking-wide">
									Create your Nova profile
								</h1>
								<p className="text-muted-foreground text-base">
									A name and an email to label your progress with.
								</p>
							</div>

							<form className="space-y-3" onSubmit={handleSubmit} noValidate>
								<div className="space-y-1.5">
									<label
										htmlFor="nova-display-name"
										className="text-sm font-medium"
									>
										Display name
									</label>
									<Input
										id="nova-display-name"
										name="name"
										autoComplete="name"
										placeholder="Anas"
										value={displayName}
										onChange={(e) => {
											setDisplayName(e.target.value);
											// Clear the error as soon as the user starts fixing it.
											if (error) setError(null);
										}}
										aria-invalid={error ? true : undefined}
										aria-describedby={error ? 'nova-profile-error' : undefined}
									/>
								</div>

								<div className="space-y-1.5">
									<label
										htmlFor="nova-email"
										className="text-sm font-medium"
									>
										Email
									</label>
									<div className="relative h-max">
										<Input
											id="nova-email"
											name="email"
											type="email"
											autoComplete="email"
											placeholder="your.email@example.com"
											className="ps-9"
											value={email}
											onChange={(e) => {
												setEmail(e.target.value);
												if (error) setError(null);
											}}
											aria-invalid={error ? true : undefined}
											aria-describedby={error ? 'nova-profile-error' : undefined}
										/>
										<div className="text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3">
											<AtSignIcon className="size-4" aria-hidden="true" />
										</div>
									</div>
								</div>

								{/* role=alert so a screen reader announces the failure
								    immediately, rather than on the next focus change. */}
								{error && (
									<p
										id="nova-profile-error"
										role="alert"
										className="text-destructive flex items-start gap-2 text-sm"
									>
										<InfoIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
										{error}
									</p>
								)}

								<Button type="submit" className="w-full">
									Create profile
								</Button>
							</form>

							<LocalOnlyNote />
						</>
					)}
				</div>
			</div>
		</main>
	);
}

/**
 * Shown instead of the form once a profile exists.
 *
 * The email is shown so the user can confirm which record they are looking at,
 * which matters more than usual when there is no password to distinguish it.
 */
function ProfileSummary({
	profile,
	onSignOut,
}: {
	profile: LocalProfile;
	onSignOut: () => void;
}) {
	return (
		<div className="space-y-5">
			<div className="flex flex-col space-y-1">
				<h1 className="font-heading text-2xl font-bold tracking-wide">
					Profile active
				</h1>
				<p className="text-muted-foreground text-base">
					Saved on this device. Nothing was sent anywhere.
				</p>
			</div>

			<div className="border-border bg-muted/40 flex items-center gap-3 rounded-lg border p-4">
				<span
					aria-hidden="true"
					className="bg-primary text-primary-foreground grid size-11 shrink-0 place-items-center rounded-full text-sm font-bold"
				>
					{initialsOf(profile.displayName)}
				</span>
				<div className="min-w-0">
					<p className="truncate font-semibold">{profile.displayName}</p>
					<p className="text-muted-foreground truncate text-sm">
						@{profile.handle} Â· {profile.email}
					</p>
				</div>
			</div>

			<Button asChild className="w-full">
				<a href="/">Enter Nova</a>
			</Button>
			<Button type="button" variant="ghost" className="w-full" onClick={onSignOut}>
				<LogOutIcon className="size-4 me-2" />
				Sign out
			</Button>

			<LocalOnlyNote />
		</div>
	);
}

/**
 * States the security posture plainly.
 *
 * A sign-in form that stores no password and verifies nothing could otherwise
 * read as a real account with a real gate in front of it. The limit is one
 * sentence, in place, instead of a link to a policy page that does not exist.
 */
function LocalOnlyNote() {
	return (
		<p className="text-muted-foreground flex items-start gap-2 text-xs">
			<ShieldAlertIcon className="mt-px size-3.5 shrink-0" aria-hidden="true" />
			<span>
				This is a local profile, not an account. It is stored in this browser
				with no password and no verification, so anyone using this device can
				read or change it, and clearing site data deletes it.
			</span>
		</p>
	);
}

function FloatingPaths({ position }: { position: number }) {
	/**
	 * Memoised on `position` deliberately.
	 *
	 * The original built this inline and called `Math.random()` inside the
	 * `transition` object, which runs on every render. framer-motion treats a
	 * changed `transition` as a new animation, so any parent re-render would
	 * redraw fresh durations and restart the whole path set mid-flight. Computing
	 * once means the paths animate steadily for the life of the page.
	 */
	const paths = useMemo(
		() =>
			Array.from({ length: 36 }, (_, i) => ({
				id: i,
				d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
					380 - i * 5 * position
				} -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
					152 - i * 5 * position
				} ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
					684 - i * 5 * position
				} ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
				strokeOpacity: 0.1 + i * 0.03,
				width: 0.5 + i * 0.03,
				duration: 20 + Math.random() * 10,
			})),
		[position]
	);

	return (
		<div className="pointer-events-none absolute inset-0">
			<svg
				className="h-full w-full text-slate-950 dark:text-white"
				viewBox="0 0 696 316"
				fill="none"
			>
				<title>Background Paths</title>
				{paths.map((path) => (
					<motion.path
						key={path.id}
						d={path.d}
						stroke="currentColor"
						strokeWidth={path.width}
						strokeOpacity={path.strokeOpacity}
						initial={{ pathLength: 0.3, opacity: 0.6 }}
						animate={{
							pathLength: 1,
							opacity: [0.3, 0.6, 0.3],
							pathOffset: [0, 1, 0],
						}}
						transition={{
							duration: path.duration,
							repeat: Number.POSITIVE_INFINITY,
							ease: 'linear',
						}}
					/>
				))}
			</svg>
		</div>
	);
}
