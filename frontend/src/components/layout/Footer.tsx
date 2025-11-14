const Footer = () => {
  return (
    <footer className="bg-neutral-100 border-t border-neutral-200 mt-auto">
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-neutral-600 text-sm">
          &copy; {new Date().getFullYear()} The Scene. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

export default Footer

