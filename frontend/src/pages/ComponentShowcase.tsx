import { useState } from 'react'
import { Button, Card, Input, Modal, Panel } from '../components/ui'

/**
 * Component Showcase - Preview all EventMemory Design System components
 * This page is for development/documentation purposes only
 */
export default function ComponentShowcase() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')

  return (
    <div className="min-h-screen vintage-bg p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-6xl font-title">
            design system showcase
          </h1>
          <p className="text-subtitle text-text-secondary">
            eventmemory component library
          </p>
        </div>

        {/* Color Palette */}
        <section>
          <h2 className="text-title mb-4">color palette</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="h-24 bg-primary rounded-card shadow-card" />
              <p className="text-label">primary</p>
              <p className="text-body">#D2C1A1</p>
            </div>
            <div className="space-y-2">
              <div className="h-24 bg-accent rounded-card shadow-card" />
              <p className="text-label">accent</p>
              <p className="text-body">#C7B291</p>
            </div>
            <div className="space-y-2">
              <div className="h-24 bg-neutral-light rounded-card shadow-card" />
              <p className="text-label">neutral light</p>
              <p className="text-body">#E8E4DC</p>
            </div>
            <div className="space-y-2">
              <div className="h-24 bg-neutral-dark rounded-card shadow-card" />
              <p className="text-label">neutral dark</p>
              <p className="text-body">#3A2E1F</p>
            </div>
          </div>
        </section>

        {/* Typography */}
        <section>
          <h2 className="text-title mb-4">typography</h2>
          <Card className="space-y-3">
            <h1 className="text-title">title text - 24px, bold</h1>
            <h2 className="text-subtitle">subtitle text - 18px, regular</h2>
            <p className="text-body">body text - 14px, regular</p>
            <p className="text-label">label text - 12px, uppercase</p>
          </Card>
        </section>

        {/* Buttons */}
        <section>
          <h2 className="text-title mb-4">buttons</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <h3 className="text-subtitle mb-4">primary buttons</h3>
              <div className="space-y-3">
                <Button variant="primary">default</Button>
                <Button variant="primary" disabled>disabled</Button>
                <Button variant="primary" fullWidth>full width</Button>
              </div>
            </Card>
            <Card>
              <h3 className="text-subtitle mb-4">secondary buttons</h3>
              <div className="space-y-3">
                <Button variant="secondary">default</Button>
                <Button variant="secondary" disabled>disabled</Button>
                <Button variant="secondary" fullWidth>full width</Button>
              </div>
            </Card>
          </div>
        </section>

        {/* Inputs */}
        <section>
          <h2 className="text-title mb-4">inputs</h2>
          <Card>
            <div className="space-y-4 max-w-md">
              <Input 
                label="text input"
                placeholder="enter text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
              <Input 
                label="email input"
                type="email"
                placeholder="email@example.com"
              />
              <Input 
                label="password input"
                type="password"
                placeholder="••••••••"
              />
              <Input 
                label="with error"
                placeholder="invalid input"
                error="this field is required"
              />
            </div>
          </Card>
        </section>

        {/* Cards */}
        <section>
          <h2 className="text-title mb-4">cards</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <h3 className="text-subtitle mb-2">basic card</h3>
              <p className="text-body text-text-secondary">
                simple card with content
              </p>
            </Card>
            <Card className="cursor-pointer hover:shadow-active transition-shadow">
              <h3 className="text-subtitle mb-2">interactive card</h3>
              <p className="text-body text-text-secondary">
                hover to see effect
              </p>
            </Card>
            <Card>
              <div className="text-2xl mb-2">📸</div>
              <h3 className="text-subtitle mb-2">card with icon</h3>
              <p className="text-body text-text-secondary">
                feature highlight card
              </p>
            </Card>
          </div>
        </section>

        {/* Panel */}
        <section>
          <h2 className="text-title mb-4">panels</h2>
          <Panel>
            <h3 className="text-subtitle mb-2">floating panel</h3>
            <p className="text-body text-text-secondary mb-3">
              panels have semi-transparent backgrounds with backdrop blur
            </p>
            <Button variant="primary">action button</Button>
          </Panel>
        </section>

        {/* Modal */}
        <section>
          <h2 className="text-title mb-4">modal</h2>
          <Card>
            <Button variant="primary" onClick={() => setIsModalOpen(true)}>
              open modal
            </Button>
          </Card>
        </section>

        {/* Event List Item */}
        <section>
          <h2 className="text-title mb-4">event list items</h2>
          <div className="space-y-4">
            <div className="event-list-item">
              <h3 className="text-subtitle mb-1">wedding celebration</h3>
              <p className="text-body text-text-secondary">october 25, 2025</p>
            </div>
            <div className="event-list-item">
              <h3 className="text-subtitle mb-1">tech conference 2024</h3>
              <p className="text-body text-text-secondary">november 15, 2024</p>
            </div>
          </div>
        </section>

        {/* Backgrounds */}
        <section>
          <h2 className="text-title mb-4">backgrounds</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="vintage-bg h-48 rounded-card flex items-center justify-center">
              <p className="text-subtitle">vintage background</p>
            </div>
            <div className="map-texture-bg h-48 rounded-card flex items-center justify-center">
              <p className="text-subtitle">map texture</p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-label text-text-secondary">
            nostalgic • refined • elegant
          </p>
        </div>
      </div>

      {/* Example Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="example modal"
      >
        <div className="space-y-4">
          <p className="text-body">
            this is a modal dialog with a title, content, and action buttons
          </p>
          <Input 
            label="modal input"
            placeholder="enter something"
          />
          <div className="flex gap-3">
            <Button variant="primary" fullWidth>
              confirm
            </Button>
            <Button 
              variant="secondary" 
              fullWidth
              onClick={() => setIsModalOpen(false)}
            >
              cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

