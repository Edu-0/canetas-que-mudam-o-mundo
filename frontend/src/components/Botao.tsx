import { ReactNode } from 'react';

export default function Botao({ children }: { children: ReactNode }) {
  return <button>{children}</button>
}