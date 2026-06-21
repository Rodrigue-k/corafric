import { SignUp } from "@clerk/nextjs";
import Image from "next/image";
import { Link } from "@/i18n/routing";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Left Column: Promo info */}
      <div className="hidden md:flex md:w-1/2 bg-foreground text-white flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-center">
          <Image
            src="/images/logo.svg"
            alt="Waveform silhouette background"
            width={600}
            height={600}
            className="object-contain"
            style={{ width: "auto", height: "auto" }}
          />
        </div>

        <div className="z-10">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 flex items-center justify-center bg-primary/10 rounded-lg">
              <Image
                src="/images/logo.svg"
                alt="Corafric Logo"
                width={24}
                height={24}
                className="object-contain"
                style={{ width: "auto", height: "auto" }}
              />
            </div>
            <span className="text-h3 font-semibold font-display tracking-tight text-white">
              Corafric
            </span>
          </Link>
        </div>

        <div className="space-y-6 z-10 max-w-lg">
          <h2 className="text-display leading-tight">
            Créer un compte Corafric
          </h2>
          <p className="text-body text-white/80 leading-relaxed">
            Rejoignez-nous aujourd&apos;hui et participez à la construction du premier dataset ouvert de voix africaines en langue Ewe.
          </p>
        </div>

        <p className="text-caption text-white/50 z-10">
          &copy; {new Date().getFullYear()} Corafric. Tous droits réservés.
        </p>
      </div>

      {/* Right Column */}
      <div className="flex-1 flex items-center justify-center p-8">
        <SignUp
          appearance={{
            elements: {
              formButtonPrimary:
                "bg-primary hover:bg-primary-hover text-white rounded-full transition-colors",
              card: "shadow-none border-0 bg-transparent",
              headerTitle: "font-display text-h1 text-foreground",
              headerSubtitle: "text-body text-text-muted",
            },
          }}
        />
      </div>
    </div>
  );
}
