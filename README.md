# Sistema de Vendas & Gestão de Aparelhos Celulares (CellVendas)

Sistema full-stack completo, moderno e intuitivo desenvolvido para lojas de celulares e assistências técnicas. O sistema conta com controle de estoque em tempo real, cadastro de clientes com validação oficial de CPF, ponto de venda (PDV) ágil e emissão/impressão profissional de recibos com termo de garantia conforme o Código de Defesa do Consumidor (CDC).

---

## 🚀 Funcionalidades Principais

### 1. Gestão de Aparelhos e Estoque
- **Cadastro Completo:** Marca, modelo, capacidade de armazenamento, cor, IMEI/número de série, preço de custo, preço de venda e estoque mínimo com alerta automático.
- **Movimentação de Estoque (Entradas e Saídas):** Registro de compras com fornecedores, devoluções, trocas, perdas e ajustes com atualização em tempo real do saldo.
- **Histórico Auditável:** Registro detalhado com data, tipo (Entrada/Saída), quantidade, saldo anterior, novo saldo e motivo.
- **Alertas de Estoque Baixo:** Indicador visual para aparelhos com quantidade igual ou inferior ao estoque mínimo.

### 2. Gestão de Clientes
- **Cadastro de Clientes:** Nome completo, CPF, e-mail, WhatsApp, endereço completo, cidade, estado (UF) e país.
- **Validação Algorítmica de CPF:** Validação real dos 2 dígitos verificadores oficiais da Receita Federal (rejeita CPFs inválidos ou sequências repetidas como 111.111.111-11).
- **Máscaras de Entrada:** Formatação automática de CPF (`000.000.000-00`) e telefone/WhatsApp (`(00) 00000-0000`).
- **Histórico do Cliente:** Consulta de perfil com total gasto e lista de todas as compras e recibos emitidos.

### 3. Vendas e Emissão de Recibos
- **Ponto de Venda (PDV) Rápido:** Seleção do cliente e múltiplos aparelhos, definição de quantidades, preços negociados e descontos.
- **Baixa Automática:** Ao finalizar a venda, o saldo do aparelho é debitado imediatamente no banco de dados e gera o log de saída correspondente.
- **Recibo de Pagamento & Termo de Garantia:**
  - Dados da loja (nome, CNPJ, telefone, e-mail, endereço).
  - Número único do recibo (`REC-YYYYMMDD-XXXX`).
  - Dados cadastrais do cliente comprador.
  - Tabela detalhada dos aparelhos vendidos com quantidade, preço unitário, subtotal e IMEI.
  - Resumo financeiro: subtotal, desconto concedido, total pago e forma de pagamento (PIX, Cartão de Crédito parcelado em até 12x, Cartão de Débito, Dinheiro).
  - Termo legal de garantia de 90 dias conforme Art. 26 do Código de Defesa do Consumidor (CDC).
  - Espaços para assinatura do vendedor e do cliente comprador.
- **Impressão & Exportação:**
  - Impressão formatada sem elementos de tela através de `@media print` (compatível com impressoras térmicas ou folhas A4 e salvamento direto em PDF).
  - Botão de cópia rápida formatada para envio direto pelo WhatsApp do cliente.

### 4. Configurações da Loja
- Personalização do cabeçalho do recibo com Nome Fantasia, CNPJ, telefone, e-mail, endereço e prazo de garantia.

---

## 🛠️ Tecnologias Utilizadas

- **Backend:** Node.js, Express, TypeScript
- **Banco de Dados:** SQLite relacional com chaves estrangeiras, persistido em arquivo local (`data/vendas_celulares.sqlite`).
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS
- **Ícones:** Lucide React

---

## 📦 Instruções de Instalação e Execução

### 1. Pré-requisitos
- Node.js versão 18 ou superior instalado.
- Gerenciador de pacotes npm.

### 2. Instalação das Dependências
```bash
npm install
```

### 3. Execução em Ambiente de Desenvolvimento
Para iniciar o servidor full-stack (backend Express + frontend Vite na porta 3000):
```bash
npm run dev
```
Abra o navegador em: [http://localhost:3000](http://localhost:3000)

### 4. Compilação e Execução para Produção
```bash
# Compilar o frontend com Vite e empacotar o backend com esbuild:
npm run build

# Iniciar o servidor de produção:
npm start
```

---

## 🗄️ Estrutura do Banco de Dados Relacional (SQLite)

- `devices`: `id`, `brand`, `model`, `storage`, `color`, `imei`, `cost_price`, `sell_price`, `stock_quantity`, `min_stock`, `created_at`, `updated_at`.
- `stock_movements`: `id`, `device_id`, `type` (ENTRADA/SAIDA), `quantity`, `previous_stock`, `new_stock`, `reason`, `cost_price`, `reference_id`, `notes`, `created_at`.
- `clients`: `id`, `cpf` (UNIQUE), `name`, `email`, `whatsapp`, `address`, `city`, `state`, `country`, `notes`, `created_at`, `updated_at`.
- `sales`: `id`, `receipt_number` (UNIQUE), `client_id`, `total_cost`, `subtotal`, `discount`, `total_amount`, `payment_method`, `installments`, `notes`, `warranty_terms`, `created_at`.
- `sale_items`: `id`, `sale_id`, `device_id`, `brand`, `model`, `storage`, `color`, `imei`, `quantity`, `unit_cost`, `unit_price`, `subtotal`.
- `store_settings`: `id`, `store_name`, `cnpj`, `phone`, `email`, `address`, `city`, `state`, `warranty_days`.
