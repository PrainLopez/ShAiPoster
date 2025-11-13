import { Twitter, Github } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-muted/30 py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <span className="text-lg font-bold">ShAIposter</span>
            </div>
            <p className="mb-4 max-w-md text-sm leading-relaxed text-muted-foreground">
              The AI that tells it like it is. No sugar coating, no fake
              positivity, just pure unfiltered commentary on your social media
              posts. You've been warned.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="#"
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                <Twitter
                  aria-label="Follow us on Twitter"
                  className="h-5 w-5"
                />
              </a>
              <a
                href="#"
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                <Github
                  aria-label="View our GitHub repository"
                  className="h-5 w-5"
                />
              </a>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold">Product</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <a href="#" className="transition-colors hover:text-foreground">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-foreground">
                  Roast Examples
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-foreground">
                  API Access
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold">Legal</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <a href="#" className="transition-colors hover:text-foreground">
                  Terms of Roasting
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-foreground">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-foreground">
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border/40 pt-8 text-center text-sm text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} ShAIposter. Your feelings are not
            our responsibility. 💀
          </p>
        </div>
      </div>
    </footer>
  );
}
