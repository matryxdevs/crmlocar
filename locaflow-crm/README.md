# Crmlocar v1.0.4 — pacote corrigido para o banco MySQL Hostinger

**Correção:** a v1.0.3 utilizava `DB_NAME` literalmente. O último log de produção mostrou que a aplicação estava tentando acessar o banco `locarcrm`, embora o banco existente seja `u426849489_locarcrm`. A v1.0.4 resolve **somente** esse caso seguro: quando `DB_USER` segue o padrão Hostinger `uNNNNNNNNN_nome` e `DB_NAME` foi preenchido apenas com o mesmo sufixo `nome`, ela usa o nome completo do usuário como nome de banco e emite aviso nos logs. Para evitar depender desse mecanismo, mantenha a variável com o nome completo.

## Variáveis exatas para esta instalação

No hPanel → aplicação Node.js → Variáveis de ambiente, configure **cada chave e valor separadamente**. As senhas abaixo são exemplos que **não funcionam até serem substituídos pelos valores reais**. Não envie senhas no chat.

```dotenv
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=u426849489_locarcrm
DB_USER=u426849489_locarcrm
DB_PASSWORD=COLE_A_SENHA_DO_MYSQL
APP_ORIGIN=https://shiny-goldenrod-penguin-71.hostingersite.com
NODE_ENV=production
TRUST_PROXY=1
ADMIN_EMAIL=hiagooslv4@gmail.com
ADMIN_PASSWORD=CRIE_SUA_SENHA_MASTER_AQUI
```

**Atenção:** `DB_PASSWORD` é a senha MySQL que a Hostinger exibiu ao criar o banco. `ADMIN_PASSWORD` é uma senha diferente, definida por você (mínimo de 12 caracteres), usada **apenas** para criar o primeiro superadministrador quando ainda não houver um. Não mantenha essa senha configurada após o primeiro acesso. Variáveis definidas no painel de hospedagem têm precedência sobre `.env` na configuração padrão de `dotenv`.

## Implantação

1. Faça backup do banco no phpMyAdmin. **Não remova nem recrie as tabelas existentes.**
2. Substitua a aplicação Node.js pelo conteúdo deste ZIP mantendo a estrutura na raiz (o arquivo `server.js` deve ficar na raiz).
3. Configure as variáveis acima **no ambiente da aplicação publicada**. Informe as senhas reais. Não copie linhas de comentário (`#`) para o editor individual de variáveis.
4. Inicie com Node.js 22, comando `npm start` (ou arquivo de entrada `server.js`, conforme a opção oferecida pelo hPanel). Reinicie/reimplante depois de salvar as variáveis.
5. Acesse `https://shiny-goldenrod-penguin-71.hostingersite.com/healthz`. A versão deverá ser **1.0.4**. `database: connected` confirma a conexão e inicialização.
6. Se ainda houver erro, veja os **logs privados de execução**. A linha `Configuração MySQL efetiva (sem senha)` mostra `database` (valor original), `databaseEffective` (utilizado no driver) e `expandedHostingerPrefix` (se houve correção automática). Jamais compartilhe a senha.

### Interpretação dos códigos de diagnóstico

- `ER_DBACCESS_DENIED_ERROR`: o usuário conectado não tem permissão no **nome de banco que aparece no log**. Confirme que esse banco existe e que o usuário está autorizado a utilizá-lo. Se `databaseEffective` for `u426849489_locarcrm`, o nome já está correto e a questão é permissão/grant.
- `ER_ACCESS_DENIED_ERROR`: credencial de usuário/senha/host recusada **antes da seleção do banco**; verifique a conta MySQL vinculada ao banco e a senha correta.
- `DB_CONFIG_INCOMPLETE`: uma variável obrigatória está vazia ou ainda contém um placeholder de senha.
- `ADMIN_NOT_CONFIGURED`: o banco foi acessado, mas o primeiro administrador ainda não pôde ser criado; forneça `ADMIN_EMAIL` e `ADMIN_PASSWORD` reais e reinicie.
- `version` diferente de `1.0.4`: a versão antiga ainda está sendo executada; publique o ZIP correto, confira a implantação ativa e reinicie.

**Limite dos testes:** 22 testes locais e validação de sintaxe passaram. Não temos acesso às credenciais, ao banco real ou aos serviços da Hostinger; uma conexão MySQL real só poderá ser validada no ambiente publicado.

---

## Diagnóstico MySQL — Crmlocar v1.0.3

Se o login continuar indisponível com `ER_ACCESS_DENIED_ERROR`, a v1.0.3 mostra, nos **logs privados da Hostinger**, a configuração efetiva recebida pelo Node.js. A linha começa com:

`[Crmlocar] Configuração MySQL efetiva (sem senha):`

A linha informa host, porta, nome do banco, usuário, `passwordProvided` e indicadores booleanos de espaços/aspas indevidos. **Nunca registra a senha ou seu comprimento.** Não exponha o log publicamente se não for necessário.

- `user` precisa ser o usuário MySQL associado ao banco, que não é necessariamente igual a `database`.
- `database` deve ser `u426849489_locarcrm` no banco novo. A conta `u426849489_crmlocar` era da instalação antiga.
- `host` deve ser `127.0.0.1` para o MySQL da hospedagem Hostinger segundo a documentação oficial.
- `passwordProvided: true` não significa que a senha esteja correta. `passwordWrappedInQuotes: true` ou `passwordHasSurroundingWhitespace: true` pode indicar erro de cópia nas variáveis de ambiente.
- Se todos os metadados estiverem corretos e persistir `ER_ACCESS_DENIED_ERROR`, a correção necessária é no usuário/senha/permissões MySQL no ambiente Hostinger, não no formulário de login nem em uma chave JWT.
- Em produção, implante a **v1.0.4** e confirme `version: 1.0.4` em `/healthz`.
- Não apague bancos/tabelas para depurar autenticação. Não compartilhe credenciais.

---

## Diagnóstico de login — versão 1.0.2

Caso o login mostre “Erro no servidor. Referência: ...”, consulte os logs de execução da Hostinger e procure a linha `[Crmlocar] ref=...` com o mesmo código. **Não envie senhas, cookies ou `.env`**. O código permite vincular a falha do navegador à exceção do servidor.

Acesse `/healthz`: `database: connected` significa que a inicialização MySQL foi concluída, `database: unavailable` significa que não foi; o campo `diagnosticCode` revela apenas o código técnico (ex.: `ER_ACCESS_DENIED_ERROR`, `ADMIN_NOT_CONFIGURED`, `APP_ORIGIN_INVALID`) e nunca expõe credenciais. O campo `version` confirma o redeploy da versão 1.0.2.

`APP_ORIGIN` deve corresponder à origem real do site e preferencialmente conter `https://` (ex.: `https://shiny-goldenrod-penguin-71.hostingersite.com`). A versão 1.0.2 também aceita o domínio puro e aspas externas copiadas; valores inválidos produzem uma mensagem de configuração em vez de erro interno obscuro. Se receber `ORIGIN_MISMATCH`, configure APP_ORIGIN de acordo com a barra de endereços do navegador.

Se `/healthz` estiver OK e o login ainda falhar, verifique o erro original no log; não exclua o banco nem recrie o administrador sem confirmar a causa. As variáveis `ADMIN_EMAIL` e `ADMIN_PASSWORD` criam a conta apenas **na primeira inicialização**: editar essas variáveis não altera uma conta já cadastrada no MySQL.

---

# Crmlocar — CRM SaaS para locadoras de veículos

**Versão:** 1.0.1 (MVP funcional — correção de inicialização MySQL)  
**Tecnologias:** Node.js 20+/22, Express, MySQL (mysql2), HTML/CSS/JavaScript.  
**Arquitetura:** aplicação Node.js única (backend + frontend), sem compilação de frontend.  
**Identidade visual:** fundo branco, violeta/roxo, tipografia preta/branca e logotipo fornecido pelo proprietário.

## 1. O que está implementado

### Painel master (superadministrador do Crmlocar)
- Autenticação com senha criptografada e sessão em cookie HttpOnly.
- Painel global com indicadores consolidados de todas as empresas.
- Cadastro de locadoras, incluindo nome, razão social, CNPJ, contatos, cidade, plano, situação, vencimento do acesso e administrador inicial.
- Edição de planos e bloqueio manual de empresas.
- Acesso administrativo à área operacional de cada empresa, para consulta e intervenção.
- Auditoria global com registro dos principais eventos.

### Painel de cada locadora
- Frota: placa única **dentro da empresa**, marca, modelo, ano, categoria, diária, km e situação.
- Clientes: nome, documento, CNH, telefones, endereço, observações.
- CRM comercial: oportunidades, canais de origem, fases, valores estimados.
- Reservas e locações: cliente, veículo, início e vencimento, valor diário e valor total, caução, km, início, conclusão e cancelamento de contratos.
- Bloqueio transacional de reservas conflitantes: não permite duas reservas/locações abertas do mesmo veículo em datas sobrepostas.
- Financeiro: registro de pagamentos vinculados à locação (Pix, cartão, dinheiro, transferência ou outro), recebimento do mês e valores pendentes.
- Manutenções: serviços programados, execução, conclusão, custos e indisponibilidade do veículo.
- Equipe: usuários por função (administrador, gestor, operacional ou financeiro), suspensão de acesso e redefinição de senhas.
- Relatórios CSV: frota, clientes, CRM, locações, pagamentos e manutenções.
- Auditoria por empresa e atualização de dados cadastrais.

O painel **não contém métricas falsas** após o login; os indicadores são consultas ao banco MySQL. Somente a imagem ilustrativa da *página pública* contém números de exemplo, identificados como fictícios.

## 2. Variáveis de ambiente (Hostinger)

Crie um banco de dados MySQL no **hPanel → Sites → Gerenciar site → Bancos de dados → Gerenciamento**.

Depois, no deployment de sua aplicação Node.js, configure:

| Variável | Exemplo ou finalidade |
| --- | --- |
| `DB_HOST` | `127.0.0.1` para MySQL da Hostinger no mesmo ambiente Node.js. Se o painel fornecer host remoto específico, use o host informado. |
| `DB_PORT` | `3306` |
| `DB_NAME` | Nome **completo** do banco, por exemplo `u123456789_crmlocar`. |
| `DB_USER` | Usuário **completo** do banco, por exemplo `u123456789_crmlocar`. |
| `DB_PASSWORD` | Senha definida para esse usuário MySQL. |
| `APP_ORIGIN` | Endereço exato do sistema, por exemplo `https://crm.seudominio.com.br` (sem `/` final). |
| `NODE_ENV` | `production` |
| `TRUST_PROXY` | `1` se HTTPS for terminado pelo proxy da Hostinger. |
| `PORT` | Opcional; a aplicação respeita `process.env.PORT` automaticamente. |
| `ADMIN_EMAIL` | E-mail do seu **superadministrador** na primeira inicialização. |
| `ADMIN_PASSWORD` | Senha inicial forte de **12 ou mais caracteres** com letras/números. |

**Nunca coloque senhas reais em código, GitHub público, capturas de tela ou mensagens para terceiros.** O arquivo `.env.example` contém exemplos fictícios e deve ser usado como modelo. Seu arquivo `.env` real já está no `.gitignore`.

### Exemplo: ambiente de desenvolvimento

Copie `.env.example` para `.env`, substitua as variáveis pelas suas credenciais e use `NODE_ENV=development` e `APP_ORIGIN=http://localhost:3000`.

O sistema **não cria o banco de dados em si**, pois a Hostinger requer que o banco seja criado pelo painel. Ele cria automaticamente as **tabelas** na primeira inicialização, se o usuário MySQL tiver permissão `CREATE TABLE`. O script completo também está em `sql/schema.sql` e pode ser importado manualmente no phpMyAdmin.

## 3. Publicar pela Hostinger

1. No hPanel, confirme que seu plano oferece hospedagem de **aplicação Node.js**; um site somente estático não executará esta API.
2. Crie o banco **MySQL**, usuário e senha no gerenciamento de banco de dados. Guarde o nome e o usuário completos, incluindo prefixos da Hostinger.
3. Use a função **Adicionar aplicação Node.js**, com opção **Enviar .zip** ou conexão com GitHub. Escolha esta pasta do projeto (ou este ZIP) como origem.
4. Utilize Node.js **22**, quando disponível. O arquivo de entrada é `server.js` e o comando é **`npm start`**. A aplicação escuta `process.env.PORT` na interface `0.0.0.0`.
5. Informe as variáveis acima no painel de ambiente, usando `APP_ORIGIN` com o domínio HTTPS real.
6. Implante/reinicie. O processo criará tabelas e, se ainda não existir um superadmin, criará o usuário a partir de `ADMIN_EMAIL` e `ADMIN_PASSWORD`.
7. Acesse `https://seu-dominio/entrar` com o e-mail/senha iniciais. Altere essa senha no menu **Configurações → Alterar minha senha** ou logo após a entrada; para novos administradores das empresas a troca no primeiro login é obrigatória.
8. Após a criação do superadmin, **remova `ADMIN_PASSWORD` do ambiente de produção**. Ela não é necessária nas próximas inicializações, pois a conta já está armazenada no MySQL com hash bcrypt.
9. Use o menu master **Empresas cadastradas → Cadastrar empresa**. Preencha os dados da locadora e credenciais do administrador dela. O login da empresa utilizará o **mesmo endereço `/entrar`**, mas exibirá somente seus próprios registros.

**Importante:** o painel da Hostinger apresenta opções diferentes conforme o plano e a interface. Não envie os arquivos somente para `public_html` como HTML estático; configure a aplicação Node.js propriamente dita.

### Correção do erro `Pool is closed` (versão 1.0.1)

O projeto original tinha um problema no `server.js`: se `initDatabase()` falhasse, o bloco de erro executava `db().end()`, **encerrando permanentemente o pool**. A aplicação podia continuar recebendo tentativas de login, que retornavam `Pool is closed`, ocultando a causa inicial da falha.

Nesta versão, **não é executado `pool.end()` durante uma falha de inicialização**. O sistema mantém o front-end acessível, mas bloqueia a API com HTTP `503` (`DATABASE_NOT_READY`) enquanto a conexão e o schema não forem inicializados. O bootstrap é tentado novamente a cada 30 segundos, sem expor detalhes sensíveis ao navegador. Os logs de execução indicam o motivo original da falha:

`[Crmlocar] Falha na inicialização do MySQL: [código] [descrição]`

Para descobrir a causa **antes de testar novamente a senha do administrador**:

1. No hPanel, configure `DB_HOST=127.0.0.1`, `DB_PORT=3306` e as credenciais reais do banco (`DB_NAME`, `DB_USER` com o prefixo completo e `DB_PASSWORD`). A Hostinger recomenda 127.0.0.1 quando MySQL e Node.js estão na mesma hospedagem.
2. Confirme que o banco **já foi criado** no hPanel; a aplicação cria tabelas, não o banco.
3. Na primeira implantação, mantenha `ADMIN_EMAIL` válido e `ADMIN_PASSWORD` com pelo menos 12 caracteres. Sem essas variáveis, a inicialização falha caso não exista nenhum `superadmin` na tabela `users`.
4. Faça o **redeploy** do arquivo ZIP atualizado na aplicação Node.js, com Node 22 e `npm start`. Preserve as credenciais e o banco de dados existentes.
5. Acesse `https://SEU-DOMINIO/healthz`. Quando o banco estiver pronto, a resposta é `{"status":"ok","database":"connected"}`. Um `503` com `database":"unavailable"` indica que a inicialização falhou; consulte os logs e procure a **primeira** linha de falha do MySQL.
6. **Não exclua o banco nem execute comandos DROP** para corrigir esse erro. As tabelas usam `CREATE TABLE IF NOT EXISTS`, preservando os registros existentes.

Se o erro persistir, procure nos logs o texto `Falha na inicialização do MySQL` e confira:

| Log | Significado provável |
|---|---|
| `ER_ACCESS_DENIED_ERROR` | Usuário/senha MySQL incorretos ou sem autorização |
| `ER_BAD_DB_ERROR` | Nome do banco não existe ou está incorreto |
| `ENOTFOUND` | Endereço `DB_HOST` incorreto |
| `ECONNREFUSED` | MySQL inacessível no host/porta configurados |
| `CREATE command denied` | Usuário MySQL sem permissão para criar as tabelas |
| `Não existe superadministrador` | Configurar `ADMIN_EMAIL` e `ADMIN_PASSWORD` na primeira instalação |

**Segurança:** não compartilhe `DB_PASSWORD`, `ADMIN_PASSWORD`, cookies de sessão ou o conteúdo do `.env`. Compartilhe apenas o texto do erro, sem credenciais.

### Erros conhecidos e solução

**`ENOTFOUND HOST_FORNECIDO_PELA_HOSTINGER`**: `DB_HOST` contém literalmente um texto de exemplo. Em ambiente integrado Hostinger, use `127.0.0.1` segundo a documentação atual; para uma conexão remota use o host específico do painel.

**`Access denied for user`**: confira `DB_USER` e `DB_NAME` completos com prefixos e a senha exata. Preferir `127.0.0.1` em vez de `localhost` evita confusão com resolução IPv6 em alguns servidores.

**`Configuração MySQL incompleta`**: variáveis não preenchidas ou não disponibilizadas para o processo Node.js.

**`Não existe superadministrador`**: defina `ADMIN_EMAIL` válido e `ADMIN_PASSWORD` de 12+ caracteres na primeira inicialização, reinicie.

**`403 Origem da solicitação não permitida`**: `APP_ORIGIN` não corresponde ao domínio exato, incluindo `https://`, usado no navegador. Ao mudar de domínio, atualize a variável e reinicie.

**`Sessão expirada` / erro de login**: autentique novamente; cookies são seguros (`Secure` e `HttpOnly`) no modo `production`, exigindo HTTPS.

### Testes rápidos após publicação

- Abra `https://seu-dominio/healthz`. Resultado esperado: `{"status":"ok","database":"connected"}`.
- Entre no `/entrar` com o superadministrador.
- Cadastre duas empresas com **e-mails de administradores diferentes**.
- Em cada uma, cadastre um veículo e um cliente; confirme que um usuário da empresa A **não encontra** registros da empresa B.
- Crie uma reserva e tente criar outra para o mesmo veículo no período sobreposto: a segunda deve falhar.
- Inicie e conclua uma locação; confira situação do veículo, quilometragem, pagamentos, dashboard e CSV.
- Bloqueie uma empresa no master e verifique que seus colaboradores não podem mais operar.

## 4. Executar no VS Code

```bash
npm install
npm start
```

Acesse `http://localhost:3000`. Em desenvolvimento, tenha um MySQL acessível, um banco já criado e as configurações no `.env`.

Para testes unitários de funções de validação:

```bash
npm test
```

Para checagem de sintaxe:

```bash
npm run check
```

## 5. Segurança e segregação dos dados

- Cada registro operacional tem `company_id` e todas as consultas/alterações são filtradas no backend por essa chave.
- O usuário comum não pode escolher arbitrariamente uma empresa via cabeçalho; apenas `superadmin` pode usar a seleção administrativa.
- Referências cruzadas (cliente, veículo, locação) são verificadas dentro do mesmo `company_id`.
- Senhas em hash bcrypt (custo 12), cookies `HttpOnly; SameSite=Strict; Secure` em produção, token de sessão aleatório armazenado com SHA-256 no banco, CSRF e rate limiting básico.
- Auditoria inclui empresa, operador, ação, objeto e IP; não grava senhas.
- Bloqueio de veículo com transação InnoDB `SELECT ... FOR UPDATE` nas etapas críticas de locação e manutenção.
- Não existe endpoint público de autocadastro de empresas. Apenas o master cadastra novas locadoras.

## 6. Limites importantes desta versão

O projeto é um **MVP funcional, não uma solução comercial auditada/certificada**. Não inclui integração automática com pagamentos, emissão fiscal/NFSe, geração e assinatura jurídica de contratos PDF, notificações por WhatsApp, rastreamento de GPS, validação automática do CNPJ com a Receita Federal, integração com bureaus, antifraude, cobrança automática de planos, upload de documentos, operação offline ou recuperação por e-mail.

A conta master controla **planos e datas de vencimento manualmente**; não foi implementado faturamento recorrente de assinaturas SaaS. O plano `past_due` é informativo: o bloqueio é efetivo com `status=suspended`, `subscription_status=suspended` ou a data de vencimento ultrapassada.

**Antes de comercializar para empresas:**
- Faça teste integrado e teste de carga em **MySQL real** na Hostinger; revise índices e paginação para bases com mais de 500 registros (as telas listam até 500 itens, a equipe até 300).
- Configure backups automáticos, testes de restauração, política de retenção e exclusão de dados, monitoramento e alerta de disponibilidade.
- Valide termos de uso, política de privacidade, contratos com locadoras (papéis de controlador/operador), LGPD, gestão de incidentes e pedidos de titulares.
- Considere autenticação multifator, recuperação segura de senhas, limites de tentativas por conta, revisão de permissões e testes de penetração antes de ampliar o volume de dados pessoais.
- A interface não faz contabilidade fiscal, conciliação bancária ou cálculo automático de encargos; valores de locação/recebimentos dependem dos dados informados pelos usuários.
- Os novos CNPJs brasileiros podem ser **alfanuméricos** desde julho de 2026. O campo `cnpj` aceita texto para não rejeitar essa mudança, porém não consulta nem valida a autenticidade do documento.

## 7. Estrutura de arquivos

```text
crmlocar-project/
├── server.js                  # servidor HTTP + segurança + prontidão da API
├── package.json               # dependências e scripts npm
├── .env.example               # modelo de configuração, sem credenciais reais
├── .gitignore                 # impede envio acidental de .env
├── sql/
│   └── schema.sql             # todas as tabelas MySQL com relações e índices
├── src/
│   ├── api.js                 # regras de negócio e rotas do SaaS
│   ├── auth.js                # login, sessão, CSRF e autorização
│   ├── db.js                  # conexão/pool, schema e bootstrap do master
│   ├── readiness.js           # inicialização/retry do banco e HTTP 503 controlado
│   └── utils.js               # validações de dados e exportação segura
├── public/
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   └── assets/
│       ├── logo-crmlocar.png # a imagem fornecida pelo proprietário
│       └── favicon.png
└── tests/
    └── utils.test.js
```

## Referências de implantação

- [Hostinger — conectar MySQL à aplicação Node.js](https://www.hostinger.com/support/connecting-a-hostinger-mysql-database-to-a-node-js-application/)
- [Hostinger — publicar aplicação Node.js](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/)
- [Hostinger — variáveis de ambiente](https://www.hostinger.com/support/how-to-add-environment-variables-during-node-js-application-deployment/)
- [Receita Federal — CNPJ alfanumérico](https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/acoes-e-programas/programas-e-atividades/cnpj-alfanumerico/cnpj-alfa)
