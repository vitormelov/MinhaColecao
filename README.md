# Minha Coleção

Minha Coleção é um aplicativo mobile desenvolvido com **React Native** e **Expo** para que os usuários possam gerenciar suas coleções. O aplicativo utiliza **Firebase** para autenticação e armazenamento de dados, onde o usuário pode criar coleções, grupos e itens, cada um com informações e valores que são automaticamente somados.

## Funcionalidades

- Autenticação de usuários com email e senha usando Firebase Auth.
- Criação, edição e deleção de **coleções**, **grupos** e **itens**.
- O valor total de cada grupo é calculado automaticamente com base nos itens adicionados, e o valor total de uma coleção é a soma de todos os grupos.
- Atualizações automáticas nos valores ao criar, editar ou deletar itens e grupos.
- Interface intuitiva, com **swipe actions** para editar e deletar itens, grupos e coleções.
  
## Requisitos

- **Node.js** (versão 14 ou superior)
- **npm** ou **yarn** (gerenciador de pacotes)
- **Expo CLI** (para rodar o app no ambiente Expo)
- **Firebase** configurado para autenticação e Firestore
- **Apple Developer Program** (para build no iOS)

