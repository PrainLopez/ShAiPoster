import { Button } from './ui/button';
import { Input } from './ui/input';
import { Flame, Zap } from 'lucide-react';

type HeroSectionProps = {
  postUrl?: string;
  onPostUrlChange?: (value: string) => void;
  onSubmit?: () => void;
};

export function HeroSection(props: HeroSectionProps = {}) {
  const { postUrl, onPostUrlChange, onSubmit } = props;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit();
      return;
    }
    const formData = new FormData(e.currentTarget);
    const url = formData.get('url') as string;
    console.log('Submitted URL:', url);

  };

  return (
    <section className="relative overflow-hidden border-b border-border/40 bg-background">
      <div className="absolute inset-0 -z-10">
        {/* Main center gradient blob */}
        <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 animate-pulse rounded-full bg-linear-to-br from-primary/20 via-primary/10 to-transparent blur-3xl" />

        {/* Right side gradient blob */}
        <div className="absolute right-0 top-1/4 h-[400px] w-[400px] animate-pulse rounded-full bg-linear-to-bl from-primary/25 via-chart-2/15 to-transparent blur-3xl animation-delay-1000" />

        {/* Left bottom gradient blob */}
        <div className="absolute left-1/4 bottom-0 h-[500px] w-[500px] animate-pulse rounded-full bg-linear-to-tr from-chart-3/20 via-primary/10 to-transparent blur-3xl animation-delay-2000" />

        {/* Additional small accent blobs for extra playfulness */}
        <div className="absolute left-0 top-1/2 h-[250px] w-[250px] animate-pulse rounded-full bg-linear-to-r from-chart-4/15 to-transparent blur-2xl animation-delay-1500" />
        <div className="absolute right-1/4 bottom-1/4 h-[300px] w-[300px] animate-pulse rounded-full bg-linear-to-l from-chart-5/20 to-transparent blur-2xl animation-delay-500" />
      </div>

      <div className="container mx-auto px-4 py-20 md:px-6 md:py-32 lg:py-40">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-linear-to-r from-primary/15 via-primary/10 to-primary/5 px-4 py-1.5 text-sm font-medium text-primary shadow-lg shadow-primary/20 backdrop-blur-sm">
            <Flame className="h-4 w-4 animate-pulse" />
            <span>Brutally Honest AI • No Filter Mode</span>
          </div>

          <h1 className="mb-6 text-balance text-4xl font-bold leading-tight tracking-tight md:text-6xl lg:text-7xl">
            Your Posts Are{' '}
            <span className="bg-linear-to-r from-primary via-chart-3 to-secondary bg-clip-text text-transparent">
              Mid
            </span>
            . Let Me Fix That.
          </h1>

          <p className="mb-10 text-pretty text-lg leading-relaxed text-muted-foreground md:text-xl">
            I'm a junior developer AI brought up by unemployed junior
            developers. Drop your URL and I'll roast it with the brutally honest
            commentary. No feelings spared. 💀
          </p>

          {/* URL Input Form */}
          <form onSubmit={handleSubmit} className="mx-auto mb-8 max-w-2xl">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                type="url"
                name="url"
                placeholder="Drop your cringe here... I dare you 👀"
                className="h-12 flex-1 border-border bg-background/80 px-4 text-base shadow-sm backdrop-blur-sm transition-all focus:border-primary/50 focus:shadow-md focus:shadow-primary/20"
                required
                {...(postUrl === undefined
                  ? {}
                  : {
                    value: postUrl,
                    onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
                      onPostUrlChange?.(event.target.value)
                  })}
              />
              <Button
                type="submit"
                size="lg"
                className="h-12 gap-2 bg-linear-to-r from-secondary to-primary px-6 shadow-lg shadow-primary/30 transition-all hover:opacity-90"
              >
                Roast Me
                <Zap className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Twitter, Instagram, TikTok, LinkedIn... I judge them all equally
              🔥
            </p>
          </form>

          <div className="flex flex-wrap items-center justify-center gap-8 text-sm md:gap-12">
            <div className="flex flex-col gap-1">
              <div className="text-2xl font-bold">0K+</div>
              <div className="text-muted-foreground">Posts Destroyed</div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="text-2xl font-bold">idk...</div>
              <div className="text-muted-foreground">Egos Bruised</div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-center gap-1 text-2xl font-bold">
                <Flame className="h-5 w-5 text-destructive" />
                186%
              </div>
              <div className="text-muted-foreground">Unhinged Takes</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
