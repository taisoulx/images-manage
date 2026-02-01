import { create } from 'zustand'

interface Image {
  id: number
  filename: string
  path: string
  thumbnailPath?: string
  size: bigint
  hash: string
  description?: string
  createdAt: Date
  updatedAt: Date
}

interface AppState {
  images: Image[]
  selectedImage: Image | null
  isLoading: boolean
  setImages: (images: Image[]) => void
  setSelectedImage: (image: Image | null) => void
  setIsLoading: (loading: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  images: [],
  selectedImage: null,
  isLoading: false,
  setImages: (images) => set({ images }),
  setSelectedImage: (image) => set({ selectedImage: image }),
  setIsLoading: (isLoading) => set({ isLoading }),
}))
