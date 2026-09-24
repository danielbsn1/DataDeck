# DataDeck — Regras de Negócio

Este documento descreve as **regras de negócio globais** do sistema: o que o DataDeck deve e não deve fazer, do ponto de vista do produto. Não contém decisões técnicas (banco, código, infraestrutura); essas ficam nos documentos de arquitetura.

**Como usar:** cada regra tem um código (`RN-XX`). Use esse código em tarefas, commits, testes e discussões para referenciar a regra sem ambiguidade. Regras ainda não decididas ficam na seção [Pendências](#7-pendências-a-definir), nunca misturadas às regras vigentes.

## Glossário

| Termo | Significado |
|---|---|
| **Usuário** | Pessoa com conta no sistema. Cada pessoa possui uma única conta. |
| **Administrador** | Usuário com permissões adicionais de gerenciamento de contas e consulta de logs. |
| **Planilha** | Arquivo enviado pelo usuário como fonte de dados (`.csv` ou `.xlsx`). |
| **Entrada manual** | Dados digitados pelo usuário diretamente no sistema, em campos que ele mesmo define. |
| **Pedido de dashboard** | Solicitação feita pelo usuário para criar um dashboard. Acompanha um status até ficar pronto. |
| **Dashboard** | Painel visual gerado a partir de um pedido concluído. |
| **Modelo pré-definido** | Dashboard de exemplo, oferecido pelo sistema, que o usuário pode adotar como ponto de partida. |
| **Log de atividade** | Registro histórico de uma ação relevante do usuário, consultável pelo administrador. |

---

## 1. Cadastro e autenticação

- **RN-01 — Cadastro.** Para criar uma conta, o usuário informa **nome, e-mail, senha e confirmação de senha**. A confirmação deve ser idêntica à senha.
- **RN-02 — Senha mínima.** A senha deve ter no mínimo **8 caracteres**.
- **RN-03 — Verificação de e-mail.** Toda conta criada exige a confirmação do e-mail informado no cadastro. Enquanto o e-mail não for confirmado, o login fica **bloqueado**.
- **RN-04 — Acesso.** Depois de confirmado o e-mail, o acesso é feito apenas com **e-mail e senha**.
- **RN-05 — Recuperação de senha.** O sistema oferece um fluxo de recuperação para o caso de esquecimento de senha.
- **RN-06 — Conta única.** Cada usuário possui uma única conta e enxerga somente os seus próprios dados.

## 2. Perfis e permissões

- **RN-07 — Perfis existentes.** O sistema possui dois perfis: **usuário** e **administrador**.
- **RN-08 — Cadastro público.** A tela de cadastro pública sempre cria uma conta com perfil de **usuário**. Não é possível se tornar administrador por essa via.
- **RN-09 — Primeiro administrador.** O primeiro administrador do sistema é criado diretamente na instalação (fora da tela de cadastro público).
- **RN-10 — Cadastro por administrador.** Um administrador pode cadastrar novos usuários por um módulo próprio de gerenciamento, escolhendo no ato do cadastro se a conta criada é **usuário** ou **administrador**.
- **RN-11 — Permissões do usuário.** Pode gerenciar apenas os próprios dados: planilhas, entradas manuais, pedidos e dashboards.
- **RN-12 — Permissões do administrador.** Um administrador pode gerenciar contas de usuários (inativar e restaurar) e consultar os logs de atividade. Um administrador **não** tem acesso aos dados ou dashboards dos usuários.
- **RN-13 — Inativação e restauração.** Um usuário inativo não consegue acessar o sistema, mas seus dados são preservados. Ao ser restaurado, volta a acessar normalmente, com tudo como estava.
- **RN-14 — Escopo dos logs.** Os logs de atividade registram apenas os dashboards criados por cada usuário e o tipo de dashboard escolhido. Nenhuma outra ação (login, upload, edição etc.) é registrada em log.
- **RN-15 — Retenção dos logs.** Um log é apagado automaticamente **30 dias** depois de criado.

## 3. Importação de planilhas

- **RN-16 — Formatos aceitos.** Somente **`.csv`** e **`.xlsx`**. Qualquer outro formato é recusado, com mensagem clara ao usuário.
- **RN-17 — Limites do arquivo.** Uma planilha enviada deve respeitar limites de tamanho e de linhas/colunas definidos pelo sistema; acima do limite, o envio é recusado com uma mensagem explicando o motivo.
- **RN-18 — Leitura do arquivo.** A primeira linha da planilha é sempre tratada como cabeçalho (nomes das colunas). Quando o arquivo `.xlsx` tiver mais de uma aba, apenas a primeira aba é considerada.
- **RN-19 — Acompanhamento.** Toda planilha enviada tem um status visível ao usuário (por exemplo: recebida, em processamento, pronta, com erro).
- **RN-20 — Planilha inválida.** Se a planilha não puder ser lida ou estiver fora do esperado, o usuário é informado do motivo, e a planilha **não** gera dashboard.
- **RN-21 — Planilha não é excluível.** Uma planilha importada não pode ser excluída pelo usuário; ela permanece salva no sistema mesmo depois de gerar um ou mais dashboards.
- **RN-22 — Reaproveitamento.** Uma mesma planilha pode ser usada como origem de mais de um dashboard, sem necessidade de reenvio do arquivo.

## 4. Entrada manual

- **RN-23 — Campos definidos pelo usuário.** Na entrada manual, o usuário define quais campos deseja (nome, tipo, ordem e se é obrigatório) e depois registra os dados nesses campos.
- **RN-24 — Campos obrigatórios.** Um registro manual não pode ser salvo sem os campos marcados como obrigatórios.

## 5. Dashboards

- **RN-25 — Criação do zero.** Para criar um dashboard do zero, o usuário deve preencher obrigatoriamente:
  1. **título**;
  2. **tipo do relatório** — campo de **texto livre**, definido pelo próprio usuário (ex.: "mercado financeiro", "vendas", "RH").
- **RN-26 — Pedido antes do dashboard.** Toda criação começa como um **pedido**, que passa por estados até estar pronto. O dashboard só existe quando o pedido é concluído com sucesso.
- **RN-27 — Fonte única.** Um dashboard usa **uma única fonte de dados**: ou uma planilha, ou uma entrada manual. Não é possível combinar as duas no mesmo dashboard.
- **RN-28 — Falha.** Se o processamento do pedido falhar, o usuário é avisado e o pedido fica marcado como falho, sem gerar dashboard incompleto.
- **RN-29 — Exclusão do dashboard.** O usuário pode excluir um dashboard gerado. Isso não afeta a planilha de origem (RN-21), que continua disponível para gerar outros dashboards.
- **RN-30 — Sem reimportação.** Um dashboard criado a partir de uma planilha não pode ter sua planilha de origem substituída ou atualizada por uma nova importação.
- **RN-31 — Edição manual pós-criação.** Depois de criado, o usuário pode corrigir manualmente os valores de um dashboard — inclusive os que vieram de uma planilha importada — linha a linha. Essa correção vale apenas para aquele dashboard: não altera a planilha original nem qualquer outro dashboard gerado a partir dela.

## 6. Modelos pré-definidos

- **RN-32 — Catálogo de exemplos.** O sistema oferece alguns dashboards de exemplo já prontos.
- **RN-33 — Adoção.** O usuário pode escolher um modelo e **adotá-lo como seu**, recebendo uma cópia própria que pode personalizar. Alterar a cópia **não afeta** o modelo original nem os dashboards de outros usuários.
- **RN-34 — Dados de exemplo.** Todo modelo pré-definido vem com dados de exemplo fictícios, para o usuário visualizar o dashboard funcionando antes de decidir adotá-lo. Os modelos são criados e mantidos por administradores.

---

## 7. Pendências (a definir)

Itens que ainda **não têm decisão**. A coluna *Sugestão* é apenas um ponto de partida.

| # | Pergunta | Por que importa | Sugestão |
|---|---|---|---|
| P-01 | Há limite de planilhas ou dashboards por usuário? | Controle de uso e custo. | Sem limite no início. |
| P-02 | Há limite de quantas vezes um dashboard pode ser editado manualmente (RN-31), ou é livre? | Evita abuso e ajuda a dimensionar histórico de alterações. | Livre no início. |

---

## Histórico

| Data | Alteração |
|---|---|
| 2026-09-21 | Versão inicial reestruturada a partir das anotações originais. |
| 2026-09-23 | Fechadas todas as pendências levantadas na revisão: autenticação (senha mínima, verificação de e-mail com bloqueio de login, recuperação de senha), perfis (primeiro admin via instalação, cadastro de usuários pelo admin, escopo do admin restrito a contas e logs, escopo e retenção dos logs em 30 dias), importação (limites de arquivo, cabeçalho/aba), dashboards (planilha não excluível, reaproveitamento de planilha entre dashboards, sem reimportação, edição manual pós-criação isolada por dashboard, tipo de relatório em texto livre) e modelos pré-definidos (vêm com dados de exemplo, mantidos por administradores). Escopo do produto confirmado como genérico. Restam apenas limites de uso (P-01, P-02). |
