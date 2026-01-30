'use client'

import Link from 'next/link'
import { Github, Twitter, Mail } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card/50 backdrop-blur">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-8 h-8 rounded bg-accent text-accent-foreground font-bold text-lg">
                ◈
              </div>
              <span className="font-bold text-foreground">Aleo Video</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Privacy-first video streaming powered by zero-knowledge proofs.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-foreground mb-4 text-sm">Product</h4>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Creators
                </Link>
              </li>
            </ul>
          </div>

          {/* Learn */}
          <div>
            <h4 className="font-semibold text-foreground mb-4 text-sm">Learn</h4>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  About Privacy
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-foreground mb-4 text-sm">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Security
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between">
          <p className="text-sm text-muted-foreground">
            © 2024 Aleo Video. Built with privacy first.
          </p>
          <div className="flex items-center gap-4 mt-6 md:mt-0">
            <Link href="#" className="text-muted-foreground hover:text-accent transition-colors">
              <Github className="w-5 h-5" />
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-accent transition-colors">
              <Twitter className="w-5 h-5" />
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-accent transition-colors">
              <Mail className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
