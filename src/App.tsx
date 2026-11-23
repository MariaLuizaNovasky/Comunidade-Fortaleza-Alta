import { Route, Routes } from 'react-router-dom'
import { Layout } from './componentes/Layout'
import { RotaProtegida } from './componentes/RotaProtegida'
import { Vazio } from './componentes/ui'
import Entrar from './paginas/Entrar'
import Painel from './paginas/Painel'
import Solicitacoes from './paginas/Solicitacoes'
import NovaSolicitacao from './paginas/NovaSolicitacao'
import DetalheSolicitacao from './paginas/DetalheSolicitacao'
import Servicos from './paginas/Servicos'
import Agendamentos from './paginas/Agendamentos'
import Espacos from './paginas/Espacos'
import Reservas from './paginas/Reservas'
import Mensalidades from './paginas/Mensalidades'
import Comunicados from './paginas/Comunicados'
import Moradores from './paginas/Moradores'
import Relatorios from './paginas/Relatorios'
import Configuracoes from './paginas/Configuracoes'
import MeuPerfil from './paginas/MeuPerfil'

/** Envolve uma página com o layout e a proteção de rota. */
function Protegida({
  children,
  somenteEquipe,
  somenteAdmin,
}: {
  children: React.ReactNode
  somenteEquipe?: boolean
  somenteAdmin?: boolean
}) {
  return (
    <RotaProtegida somenteEquipe={somenteEquipe} somenteAdmin={somenteAdmin}>
      <Layout>{children}</Layout>
    </RotaProtegida>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/entrar" element={<Entrar />} />

      <Route path="/" element={<Protegida><Painel /></Protegida>} />
      <Route path="/solicitacoes" element={<Protegida><Solicitacoes /></Protegida>} />
      <Route path="/solicitacoes/nova" element={<Protegida><NovaSolicitacao /></Protegida>} />
      <Route path="/solicitacoes/:id" element={<Protegida><DetalheSolicitacao /></Protegida>} />
      <Route path="/servicos" element={<Protegida><Servicos /></Protegida>} />
      <Route path="/agendamentos" element={<Protegida><Agendamentos /></Protegida>} />
      <Route path="/espacos" element={<Protegida><Espacos /></Protegida>} />
      <Route path="/reservas" element={<Protegida><Reservas /></Protegida>} />
      <Route path="/mensalidades" element={<Protegida><Mensalidades /></Protegida>} />
      <Route path="/comunicados" element={<Protegida><Comunicados /></Protegida>} />
      <Route path="/perfil" element={<Protegida><MeuPerfil /></Protegida>} />

      <Route
        path="/moradores"
        element={<Protegida somenteEquipe><Moradores /></Protegida>}
      />
      <Route
        path="/relatorios"
        element={<Protegida somenteEquipe><Relatorios /></Protegida>}
      />
      <Route
        path="/configuracoes"
        element={<Protegida somenteAdmin><Configuracoes /></Protegida>}
      />

      <Route
        path="*"
        element={
          <Protegida>
            <Vazio
              icone="busca"
              titulo="Página não encontrada"
              descricao="O endereço acessado não existe ou foi movido."
            />
          </Protegida>
        }
      />
    </Routes>
  )
}
