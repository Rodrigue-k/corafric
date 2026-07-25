import { useTranslations } from "next-intl";
import { DictionarySearch } from "@/components/ui/DictionarySearch";
import { BookOpen, ShieldCheck } from "lucide-react";

export default function DictionaryPage() {
  const t = useTranslations("common");

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-fade-in pb-20 mt-10">
      <div className="text-center space-y-6">
        <div className="inline-flex items-center justify-center p-4 bg-primary/10 text-primary rounded-2xl mb-2">
          <BookOpen className="w-10 h-10" />
        </div>
        <h1 className="text-h1 font-display font-bold text-foreground">
          Dictionnaire Trilingue
        </h1>
        <p className="text-lg text-text-muted max-w-2xl mx-auto leading-relaxed">
          Éwé • Français • Anglais
        </p>
        
        <div className="flex items-center justify-center gap-2 text-sm font-medium text-emerald-600 bg-emerald-50 px-4 py-1.5 rounded-full w-max mx-auto border border-emerald-200 shadow-sm">
          <ShieldCheck className="w-4 h-4" />
          <span>Données croisées haute fiabilité</span>
        </div>
      </div>

      <DictionarySearch />
    </div>
  );
}
