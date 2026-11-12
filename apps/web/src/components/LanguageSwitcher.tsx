import { useTranslation } from 'react-i18next';
import { LANGUAGES, currentLanguage } from '@/i18n';
import { cn } from '@/lib/utils';

/** FR / EN toggle; the choice is remembered (localStorage) by the language detector. */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { t, i18n } = useTranslation();
  const active = currentLanguage();
  return (
    <div role="group" aria-label={t('common.language')} className={cn('flex gap-0.5', className)}>
      {LANGUAGES.map((lng) => (
        <button
          key={lng}
          type="button"
          lang={lng}
          aria-pressed={lng === active}
          onClick={() => void i18n.changeLanguage(lng)}
          className={cn(
            'h-8 rounded-md px-2 font-mono text-xs uppercase transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
            lng === active
              ? 'bg-accent font-medium text-accent-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {lng}
        </button>
      ))}
    </div>
  );
}
