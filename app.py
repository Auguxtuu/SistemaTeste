from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_bcrypt import Bcrypt # Usado para hashing de senhas
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity # NOVO: Importações JWT
from decimal import Decimal, InvalidOperation
from datetime import datetime, timedelta # NOVO: Para tempo de expiração do JWT
from dotenv import load_dotenv
import os # Para chave secreta
from sqlalchemy.orm import joinedload

load_dotenv()

app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DB_CONNECTION_STRING')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Ex: secrets.token_hex(32) em Python
app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY") 
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1)
db = SQLAlchemy(app)
CORS(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app) # NOVO: Inicializar JWTManager

# --- Modelo de Dados do Produto ---
class Produto(db.Model):
    __tablename__ = 'produtos'

    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(255), nullable=False)
    codigo = db.Column(db.String(100), unique=True, nullable=False)
    descricao = db.Column(db.Text, nullable=True)
    unidade_medida = db.Column(db.String(50), nullable=False)
    estoque_atual = db.Column(db.Integer, default=0, nullable=False)
    estoque_minimo = db.Column(db.Integer, default=0, nullable=False)
    localizacao = db.Column(db.String(255), nullable=True)

    preco_compra = db.Column(db.Numeric(10, 2), nullable=False)
    preco_venda = db.Column(db.Numeric(10, 2), nullable=False)

    ncm = db.Column(db.String(8), nullable=True)
    cst_csosn = db.Column(db.String(4), nullable=True)
    cfop = db.Column(db.String(4), nullable=True)
    origem_mercadoria = db.Column(db.String(1), nullable=True)

    icms_aliquota = db.Column(db.Numeric(5, 2), nullable=True)
    icms_valor = db.Column(db.Numeric(10, 2), nullable=True)

    ipi_aliquota = db.Column(db.Numeric(5, 2), nullable=True)
    ipi_valor = db.Column(db.Numeric(10, 2), nullable=True)

    pis_aliquota = db.Column(db.Numeric(5, 2), nullable=True)
    pis_valor = db.Column(db.Numeric(10, 2), nullable=True)

    cofins_aliquota = db.Column(db.Numeric(5, 2), nullable=True)
    cofins_valor = db.Column(db.Numeric(10, 2), nullable=True)

    info_adicionais_nf = db.Column(db.Text, nullable=True)

    movimentacoes = db.relationship('Movimentacao', backref='produto', lazy=True)
    fornecedor_id = db.Column(db.Integer, db.ForeignKey('fornecedores.id'), nullable=True)
    fornecedor = db.relationship('Fornecedor', backref='produtos_fornecidos', lazy=True)


    def __repr__(self):
        return f'<Produto {self.nome} - Código: {self.codigo}>'

    def to_dict(self):
        return {
            'id': self.id,
            'nome': self.nome,
            'codigo': self.codigo,
            'descricao': self.descricao,
            'unidade_medida': self.unidade_medida,
            'estoque_atual': self.estoque_atual,
            'estoque_minimo': self.estoque_minimo,
            'localizacao': self.localizacao,
            'preco_compra': float(self.preco_compra) if self.preco_compra is not None else None,
            'preco_venda': float(self.preco_venda) if self.preco_venda is not None else None,
            'ncm': self.ncm,
            'cst_csosn': self.cst_csosn,
            'cfop': self.cfop,
            'origem_mercadoria': self.origem_mercadoria,
            'icms_aliquota': float(self.icms_aliquota) if self.icms_aliquota is not None else None,
            'icms_valor': float(self.icms_valor) if self.icms_valor is not None else None,
            'ipi_aliquota': float(self.ipi_aliquota) if self.ipi_aliquota is not None else None,
            'ipi_valor': float(self.ipi_valor) if self.ipi_valor is not None else None,
            'pis_aliquota': float(self.pis_aliquota) if self.pis_aliquota is not None else None,
            'pis_valor': float(self.pis_valor) if self.pis_valor is not None else None,
            'cofins_aliquota': float(self.cofins_aliquota) if self.cofins_aliquota is not None else None,
            'cofins_valor': float(self.cofins_valor) if self.cofins_valor is not None else None,
            'info_adicionais_nf': self.info_adicionais_nf,
            'fornecedor_id': self.fornecedor_id,
            'fornecedor_nome': self.fornecedor.nome if self.fornecedor else None
        }

# --- Modelo de Dados da Movimentação ---
class Movimentacao(db.Model):
    __tablename__ = 'movimentacoes'

    id = db.Column(db.Integer, primary_key=True)
    produto_id = db.Column(db.Integer, db.ForeignKey('produtos.id'), nullable=False)
    tipo_movimentacao = db.Column(db.String(10), nullable=False) # 'entrada' ou 'saida'
    quantidade = db.Column(db.Integer, nullable=False)
    data_hora = db.Column(db.DateTime, nullable=False, default=datetime.now) # Data e hora automáticas
    observacao = db.Column(db.Text, nullable=True)
    numero_nota_fiscal = db.Column(db.String(100), nullable=True) # Para entradas/saídas com NF
    cliente_id = db.Column(db.Integer, db.ForeignKey('clientes.id'), nullable=True) # Vinculo com cliente
    cliente = db.relationship('Cliente', backref='movimentacoes_saida', lazy=True)


    def __repr__(self):
        return f'<Movimentacao {self.tipo_movimentacao} de {self.quantidade} do Produto ID {self.produto_id}>'

    def to_dict(self):
        return {
            'id': self.id,
            'produto_id': self.produto_id,
            'tipo_movimentacao': self.tipo_movimentacao,
            'quantidade': self.quantidade,
            'data_hora': self.data_hora.isoformat() if self.data_hora else None,
            'observacao': self.observacao,
            'numero_nota_fiscal': self.numero_nota_fiscal,
            'cliente_id': self.cliente_id,
            'cliente_nome': self.cliente.nome if self.cliente else None
        }

# --- Modelo de Dados do Fornecedor ---
class Fornecedor(db.Model):
    __tablename__ = 'fornecedores'

    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(255), nullable=False, unique=True)
    cnpj = db.Column(db.String(18), unique=True, nullable=True)
    email = db.Column(db.String(255), nullable=True)
    telefone = db.Column(db.String(20), nullable=True)
    endereco = db.Column(db.Text, nullable=True)

    def __repr__(self):
        return f'<Fornecedor {self.nome}>'

    def to_dict(self):
        return {
            'id': self.id,
            'nome': self.nome,
            'cnpj': self.cnpj,
            'email': self.email,
            'telefone': self.telefone,
            'endereco': self.endereco
        }

# --- Modelo de Dados do Cliente ---
class Cliente(db.Model):
    __tablename__ = 'clientes'

    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(255), nullable=False)
    cpf = db.Column(db.String(14), unique=True, nullable=True)
    email = db.Column(db.String(255), nullable=True)
    telefone = db.Column(db.String(20), nullable=True)
    endereco = db.Column(db.Text, nullable=True)

    def __repr__(self):
        return f'<Cliente {self.nome}>'

    def to_dict(self):
        return {
            'id': self.id,
            'nome': self.nome,
            'cpf': self.cpf,
            'email': self.email,
            'telefone': self.telefone,
            'endereco': self.endereco
        }

# --- Modelo de Dados do Usuário ---
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    
    def __repr__(self):
        return f'<User {self.username}>'

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
        }


# --- Criação das Tabelas no Banco de Dados ---
with app.app_context():
    db.create_all()
    print("Tabelas criadas ou já existentes no banco de dados!")

# --- Função auxiliar para calcular o valor do imposto com precisão Decimal ---
def calculate_tax_value(price_decimal_input, aliquot_decimal_input):
    try:
        price = Decimal(str(price_decimal_input)) if not isinstance(price_decimal_input, Decimal) else price_decimal_input
        aliquot = Decimal(str(aliquot_decimal_input)) if not isinstance(aliquot_decimal_input, Decimal) else aliquot_decimal_input

        if price is None: price = Decimal(0)
        if aliquot is None: aliquot = Decimal(0)

        if aliquot < 0:
            aliquot = Decimal(0)

        return (price * (aliquot / Decimal(100))).quantize(Decimal('0.01'))
    except (InvalidOperation, TypeError):
        return Decimal(0)

# --- Rotas de Autenticação ---
@app.route('/register', methods=['POST'])
def register_user():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        return jsonify({"message": "Nome de usuário, email e senha são obrigatórios."}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"message": "Nome de usuário já existe."}), 409
    
    if User.query.filter_by(email=email).first():
        return jsonify({"message": "Email já registrado."}), 409

    new_user = User(username=username, email=email)
    new_user.set_password(password)

    try:
        db.session.add(new_user)
        db.session.commit()
        return jsonify({"message": "Usuário registrado com sucesso!", "user": new_user.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Erro ao registrar usuário: {str(e)}"}), 500

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    # Remova as linhas de print de depuração em produção
    print(f"Tentativa de login para o email: {email}")
    print(f"Senha recebida: {password}")

    if not email or not password:
        return jsonify({'message': 'Email e senha são obrigatórios.'}), 400

    user = User.query.filter_by(email=email).first()

    if user and user.check_password(password):
        # Gerar o token de acesso JWT
        access_token = create_access_token(identity=user.id) # 'identity' pode ser o ID do usuário
        print("Login bem-sucedido. Token gerado.") # DEBUG
        return jsonify({'message': 'Login realizado com sucesso!', 'token': access_token, 'username': user.username}), 200
    else:
        print("Credenciais inválidas.") # DEBUG
        return jsonify({'message': 'Credenciais inválidas.'}), 401

# --- Rota Protegida (para teste) ---
@app.route('/protected', methods=['GET'])
@jwt_required() # Protege esta rota
def protected():
    current_user_id = get_jwt_identity() # Obtém a identidade do token (o user.id)
    user = User.query.get(current_user_id)
    if user:
        return jsonify({'message': f'Bem-vindo, {user.username}! Você acessou uma rota protegida.', 'user_id': current_user_id}), 200
    return jsonify({'message': 'Usuário não encontrado.'}), 404


# --- Rotas da API (Produto) ---
@app.route('/produtos', methods=['POST'])
@jwt_required() # Protege a rota de adicionar produto
def add_produto():
    data = request.get_json()

    if not data or not all(k in data for k in ['nome', 'codigo', 'unidade_medida', 'preco_compra', 'preco_venda']):
        return jsonify({"message": "Dados do produto incompletos. Campos obrigatórios: nome, codigo, unidade_medida, preco_compra, preco_venda."}), 400

    try:
        preco_venda = Decimal(str(data['preco_venda']))
        preco_compra = Decimal(str(data['preco_compra']))
    except InvalidOperation:
        return jsonify({"message": "Preço de compra ou venda inválido."}), 400

    icms_aliquota = Decimal(str(data.get('icms_aliquota', 0)))
    icms_valor = calculate_tax_value(preco_venda, icms_aliquota)

    ipi_aliquota = Decimal(str(data.get('ipi_aliquota', 0)))
    ipi_valor = calculate_tax_value(preco_venda, ipi_aliquota)

    pis_aliquota = Decimal(str(data.get('pis_aliquota', 0)))
    pis_valor = calculate_tax_value(preco_venda, pis_aliquota)

    cofins_aliquota = Decimal(str(data.get('cofins_aliquota', 0)))
    cofins_valor = calculate_tax_value(preco_venda, cofins_aliquota)

    fornecedor_id = data.get('fornecedor_id')
    if fornecedor_id is not None and fornecedor_id != '':
        fornecedor = Fornecedor.query.get(fornecedor_id)
        if not fornecedor:
            return jsonify({"message": "Fornecedor não encontrado com o ID fornecido."}), 400
    else:
        fornecedor_id = None


    novo_produto = Produto(
        nome=data['nome'],
        codigo=data['codigo'],
        unidade_medida=data['unidade_medida'],
        preco_compra=preco_compra,
        preco_venda=preco_venda,
        descricao=data.get('descricao'),
        estoque_atual=data.get('estoque_atual', 0),
        estoque_minimo=data.get('estoque_minimo', 0),
        localizacao=data.get('localizacao'),
        ncm=data.get('ncm'),
        cst_csosn=data.get('cst_csosn'),
        cfop=data.get('cfop'),
        origem_mercadoria=data.get('origem_mercadoria'),
        icms_aliquota=icms_aliquota,
        icms_valor=icms_valor,
        ipi_aliquota=ipi_aliquota,
        ipi_valor=ipi_valor,
        pis_aliquota=pis_aliquota,
        pis_valor=pis_valor,
        cofins_aliquota=cofins_aliquota,
        cofins_valor=cofins_valor,
        info_adicionais_nf=data.get('info_adicionais_nf'),
        fornecedor_id=fornecedor_id
    )

    try:
        db.session.add(novo_produto)
        db.session.commit()
        return jsonify({"message": "Produto adicionado com sucesso!", "produto": novo_produto.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        if "Duplicate entry" in str(e) and "for key 'produtos.codigo'" in str(e):
             return jsonify({"message": "Erro: Código de produto já existente. Por favor, use um código único."}), 409
        return jsonify({"message": f"Erro ao adicionar produto: {str(e)}"}), 500

@app.route('/produtos', methods=['GET'])
@jwt_required() # Protege a rota de listar produtos
def get_produtos():
    query = Produto.query

    search_term = request.args.get('search', type=str)
    stock_status = request.args.get('stock_status', type=str)
    unidade_medida_filter = request.args.get('unidade_medida', type=str)
    fornecedor_id_filter = request.args.get('fornecedor_id', type=int)

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)

    if search_term:
        query = query.filter(
            (Produto.nome.ilike(f'%{search_term}%')) |
            (Produto.codigo.ilike(f'%{search_term}%'))
        )

    if stock_status:
        if stock_status == 'baixo':
            query = query.filter(Produto.estoque_atual <= Produto.estoque_minimo)
        elif stock_status == 'em_falta':
            query = query.filter(Produto.estoque_atual == 0)
        elif stock_status == 'disponivel':
            query = query.filter(Produto.estoque_atual > Produto.estoque_minimo, Produto.estoque_atual > 0)

    if unidade_medida_filter:
        query = query.filter(Produto.unidade_medida.ilike(f'%{unidade_medida_filter}%'))

    if fornecedor_id_filter:
        query = query.filter_by(fornecedor_id=fornecedor_id_filter)

    paginated_products = query.paginate(page=page, per_page=per_page, error_out=False)

    produtos_json = [produto.to_dict() for produto in paginated_products.items]
    
    return jsonify({
        'items': produtos_json,
        'total_items': paginated_products.total,
        'total_pages': paginated_products.pages,
        'current_page': paginated_products.page,
        'per_page': paginated_products.per_page,
        'has_next': paginated_products.has_next,
        'has_prev': paginated_products.has_prev
    }), 200

@app.route('/produtos/<int:produto_id>', methods=['GET'])
@jwt_required() # Protege a rota de obter produto por ID
def get_produto(produto_id):
    produto = Produto.query.get(produto_id)
    if produto:
        return jsonify(produto.to_dict()), 200
    return jsonify({"message": "Produto não encontrado."}), 404

@app.route('/produtos/<int:produto_id>', methods=['PUT'])
@jwt_required() # Protege a rota de atualizar produto
def update_produto(produto_id):
    produto = Produto.query.get(produto_id)
    if not produto:
        return jsonify({"message": "Produto não encontrado."}), 404

    data = request.get_json()
    if not data:
        return jsonify({"message": "Nenhum dado fornecido para atualização."}), 400

    produto.nome = data.get('nome', produto.nome)
    produto.codigo = data.get('codigo', produto.codigo)
    produto.descricao = data.get('descricao', produto.descricao)
    produto.unidade_medida = data.get('unidade_medida', produto.unidade_medida)
    produto.estoque_atual = data.get('estoque_atual', produto.estoque_atual)
    produto.estoque_minimo = data.get('estoque_minimo', produto.estoque_minimo)
    produto.localizacao = data.get('localizacao', produto.localizacao)
    produto.info_adicionais_nf = data.get('info_adicionais_nf', produto.info_adicionais_nf)

    try:
        if 'preco_compra' in data and data['preco_compra'] is not None:
            produto.preco_compra = Decimal(str(data['preco_compra']))
        if 'preco_venda' in data and data['preco_venda'] is not None:
            produto.preco_venda = Decimal(str(data['preco_venda']))
    except InvalidOperation:
        return jsonify({"message": "Preço de compra ou venda inválido na atualização."}), 400

    current_preco_venda = produto.preco_venda

    if 'ncm' in data: produto.ncm = data['ncm']
    if 'cst_csosn' in data: produto.cst_csosn = data['cst_csosn']
    if 'cfop' in data: produto.cfop = data['cfop']
    if 'origem_mercadoria' in data: produto.origem_mercadoria = data['origem_mercadoria']

    icms_aliquota_data = data.get('icms_aliquota')
    if icms_aliquota_data is not None:
        produto.icms_aliquota = Decimal(str(icms_aliquota_data))
    produto.icms_valor = calculate_tax_value(current_preco_venda, produto.icms_aliquota)

    ipi_aliquota_data = data.get('ipi_aliquota')
    if ipi_aliquota_data is not None:
        produto.ipi_aliquota = Decimal(str(ipi_aliquota_data))
    produto.ipi_valor = calculate_tax_value(current_preco_venda, produto.ipi_aliquota)

    pis_aliquota_data = data.get('pis_aliquota')
    if pis_aliquota_data is not None:
        produto.pis_aliquota = Decimal(str(pis_aliquota_data))
    produto.pis_valor = calculate_tax_value(current_preco_venda, produto.pis_aliquota)

    cofins_aliquota_data = data.get('cofins_aliquota')
    if cofins_aliquota_data is not None:
        produto.cofins_aliquota = Decimal(str(cofins_aliquota_data))
    produto.cofins_valor = calculate_tax_value(current_preco_venda, produto.cofins_aliquota)

    if 'fornecedor_id' in data:
        if data['fornecedor_id'] is not None and data['fornecedor_id'] != '':
            fornecedor = Fornecedor.query.get(data['fornecedor_id'])
            if not fornecedor:
                return jsonify({"message": "Fornecedor não encontrado com o ID fornecido."}), 400
            produto.fornecedor_id = data['fornecedor_id']
        else:
            produto.fornecedor_id = None


    try:
        db.session.commit()
        return jsonify({"message": "Produto atualizado com sucesso!", "produto": produto.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        if "Duplicate entry" in str(e) and "for key 'produtos.codigo'" in str(e):
             return jsonify({"message": "Erro: Código de produto já existente. Por favor, use um código único."}), 409
        return jsonify({"message": f"Erro ao atualizar produto: {str(e)}"}), 500


@app.route('/produtos/<int:produto_id>', methods=['DELETE'])
@jwt_required() # Protege a rota de deletar produto
def delete_produto(produto_id):
    produto = Produto.query.get(produto_id)
    if not produto:
        return jsonify({"message": "Produto não encontrado."}), 404

    try:
        db.session.delete(produto)
        db.session.commit()
        return jsonify({"message": "Produto excluído com sucesso!"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Erro ao excluir produto: {str(e)}"}), 500


# --- Rotas da API para Movimentações ---

@app.route('/movimentacoes', methods=['POST'])
@jwt_required() # Protege a rota de adicionar movimentação
def add_movimentacao():
    data = request.get_json()

    if not data or not all(k in data for k in ['produto_id', 'tipo_movimentacao', 'quantidade']):
        return jsonify({"message": "Dados da movimentação incompletos."}), 400

    produto_id = data['produto_id']
    tipo_movimentacao = data['tipo_movimentacao']
    quantidade = data['quantidade']
    cliente_id = data.get('cliente_id')

    if quantidade <= 0:
        return jsonify({"message": "Quantidade deve ser maior que zero."}), 400

    produto = Produto.query.get(produto_id)
    if not produto:
        return jsonify({"message": "Produto não encontrado."}), 404

    if tipo_movimentacao not in ['entrada', 'saida']:
        return jsonify({"message": "Tipo de movimentação inválido. Use 'entrada' ou 'saida'."}), 400
    
    if tipo_movimentacao == 'saida' and cliente_id is not None and cliente_id != '':
        cliente = Cliente.query.get(cliente_id)
        if not cliente:
            return jsonify({"message": "Cliente não encontrado com o ID fornecido para esta saída."}), 400
    elif tipo_movimentacao == 'saida' and (cliente_id is None or cliente_id == ''):
        pass
    else:
        cliente_id = None


    try:
        if tipo_movimentacao == 'entrada':
            produto.estoque_atual += quantidade
        elif tipo_movimentacao == 'saida':
            if produto.estoque_atual < quantidade:
                return jsonify({"message": "Estoque insuficiente para esta saída."}), 400
            produto.estoque_atual -= quantidade

        nova_movimentacao = Movimentacao(
            produto_id=produto_id,
            tipo_movimentacao=tipo_movimentacao,
            quantidade=quantidade,
            observacao=data.get('observacao'),
            numero_nota_fiscal=data.get('numero_nota_fiscal'),
            cliente_id=cliente_id
        )

        db.session.add(nova_movimentacao)
        db.session.commit()
        return jsonify({"message": f"Movimentação de {tipo_movimentacao} registrada com sucesso! Estoque atualizado.", "movimentacao": nova_movimentacao.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Erro ao registrar movimentação: {str(e)}"}), 500

@app.route('/movimentacoes', methods=['GET'])
@jwt_required() # Protege a rota de listar movimentações
def get_movimentacoes():
    produto_id_filter = request.args.get('produto_id', type=int)
    tipo_movimentacao_filter = request.args.get('tipo', type=str)
    start_date_filter = request.args.get('start_date', type=str)
    end_date_filter = request.args.get('end_date', type=str)

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)

    query = Movimentacao.query.order_by(Movimentacao.data_hora.desc())

    if produto_id_filter:
        query = query.filter_by(produto_id=produto_id_filter)
    if tipo_movimentacao_filter:
        query = query.filter_by(tipo_movimentacao=tipo_movimentacao_filter)
    
    if start_date_filter:
        try:
            start_dt = datetime.fromisoformat(start_date_filter)
            query = query.filter(Movimentacao.data_hora >= start_dt)
        except ValueError:
            return jsonify({"message": "Formato de data de início inválido. UseYYYY-MM-DD."}), 400
    
    if end_date_filter:
        try:
            end_dt = datetime.fromisoformat(end_date_filter)
            end_dt = end_dt.replace(hour=23, minute=59, second=59, microsecond=999999)
            query = query.filter(Movimentacao.data_hora <= end_dt)
        except ValueError:
            return jsonify({"message": "Formato de data de fim inválido. UseYYYY-MM-DD."}), 400

    if request.args.get('cliente_id', type=int):
        query = query.filter_by(cliente_id=request.args.get('cliente_id', type=int))

    paginated_movs = query.paginate(page=page, per_page=per_page, error_out=False)

    movimentacoes_json = []
    for mov in paginated_movs.items:
        mov_dict = mov.to_dict()
        produto = Produto.query.get(mov.produto_id)
        if produto:
            mov_dict['produto_nome'] = produto.nome
            mov_dict['produto_codigo'] = produto.codigo
        cliente = Cliente.query.get(mov.cliente_id)
        if cliente:
            mov_dict['cliente_nome'] = cliente.nome
        movimentacoes_json.append(mov_dict)
    
    return jsonify({
        'items': movimentacoes_json,
        'total_items': paginated_movs.total,
        'total_pages': paginated_movs.pages,
        'current_page': paginated_movs.page,
        'per_page': paginated_movs.per_page,
        'has_next': paginated_movs.has_next,
        'has_prev': paginated_movs.has_prev
    }), 200

@app.route('/produtos/<int:produto_id>/movimentacoes', methods=['GET'])
@jwt_required() # Protege a rota de listar movimentações por produto
def get_movimentacoes_por_produto(produto_id):
    produto = Produto.query.get(produto_id)
    if not produto:
        return jsonify({"message": "Produto não encontrado."}), 404

    tipo_movimentacao_filter = request.args.get('tipo', type=str)
    start_date_filter = request.args.get('start_date', type=str)
    end_date_filter = request.args.get('end_date', type=str)

    query = Movimentacao.query.filter_by(produto_id=produto_id).order_by(Movimentacao.data_hora.desc())

    if tipo_movimentacao_filter:
        query = query.filter_by(tipo_movimentacao=tipo_movimentacao_filter)
    
    if start_date_filter:
        try:
            start_dt = datetime.fromisoformat(start_date_filter)
            query = query.filter(Movimentacao.data_hora >= start_dt)
        except ValueError:
            return jsonify({"message": "Formato de data de início inválido. UseYYYY-MM-DD."}), 400
    
    if end_date_filter:
        try:
            end_dt = datetime.fromisoformat(end_date_filter)
            end_dt = end_dt.replace(hour=23, minute=59, second=59, microsecond=999999)
            query = query.filter(Movimentacao.data_hora <= end_dt)
        except ValueError:
            return jsonify({"message": "Formato de data de fim inválido. UseYYYY-MM-DD."}), 400


    movimentacoes = query.all()
    movimentacoes_json = []
    for mov in movimentacoes:
        mov_dict = mov.to_dict()
        cliente = Cliente.query.get(mov.cliente_id)
        if cliente:
            mov_dict['cliente_nome'] = cliente.nome
        movimentacoes_json.append(mov_dict)
    return jsonify(movimentacoes_json), 200


# --- Rota para Relatórios de Estoque Crítico ---
@app.route('/relatorios/estoque_critico', methods=['GET'])
@jwt_required() # Protege a rota de relatório de estoque crítico
def get_estoque_critico_report():
    report_type = request.args.get('tipo', 'baixo') # 'baixo' (default) ou 'em_falta'

    query = Produto.query

    if report_type == 'baixo':
        query = query.filter(Produto.estoque_atual <= Produto.estoque_minimo)
    elif report_type == 'em_falta':
        query = query.filter(Produto.estoque_atual == 0)
    else:
        return jsonify({"message": "Tipo de relatório inválido. Use 'baixo' ou 'em_falta'."}), 400

    produtos_criticos = query.order_by(Produto.nome).all()
    produtos_criticos_json = [p.to_dict() for p in produtos_criticos]

    return jsonify(produtos_criticos_json), 200


# --- Rota para Dashboard (Dados de Resumo) ---
@app.route('/dashboard/resumo', methods=['GET'])
@jwt_required() # Protege a rota do dashboard
def get_dashboard_summary():
    total_produtos = Produto.query.count()
    produtos_estoque_baixo = Produto.query.filter(Produto.estoque_atual <= Produto.estoque_minimo).count()
    produtos_em_falta = Produto.query.filter(Produto.estoque_atual == 0).count()
    
    ultimas_movimentacoes = Movimentacao.query.options(
        joinedload(Movimentacao.produto),
        joinedload(Movimentacao.cliente)
    ).order_by(Movimentacao.data_hora.desc()).limit(5).all()

    ultimas_movimentacoes_json = []
    for mov in ultimas_movimentacoes:
        mov_dict = mov.to_dict()
        # Agora os dados já vieram na consulta, sem precisar buscar de novo
        mov_dict['produto_nome'] = mov.produto.nome if mov.produto else "Produto Removido"
        mov_dict['produto_codigo'] = mov.produto.codigo if mov.produto else "N/A"
        mov_dict['cliente_nome'] = mov.cliente.nome if mov.cliente else None
        ultimas_movimentacoes_json.append(mov_dict)

    total_entradas = db.session.query(db.func.sum(Movimentacao.quantidade)).filter_by(tipo_movimentacao='entrada').scalar() or 0
    total_saidas = db.session.query(db.func.sum(Movimentacao.quantidade)).filter_by(tipo_movimentacao='saida').scalar() or 0

    return jsonify({
        'total_produtos': total_produtos,
        'produtos_estoque_baixo': produtos_estoque_baixo,
        'produtos_em_falta': produtos_em_falta,
        'ultimas_movimentacoes': ultimas_movimentacoes_json,
        'total_entradas': total_entradas,
        'total_saidas': total_saidas
    }), 200

# --- Rotas da API para Fornecedores ---

@app.route('/fornecedores', methods=['POST'])
@jwt_required() # Protege a rota de adicionar fornecedor
def add_fornecedor():
    data = request.get_json()
    if not data or not data.get('nome'):
        return jsonify({"message": "Nome do fornecedor é obrigatório."}), 400
    
    try:
        novo_fornecedor = Fornecedor(
            nome=data['nome'],
            cnpj=data.get('cnpj'),
            email=data.get('email'),
            telefone=data.get('telefone'),
            endereco=data.get('endereco')
        )
        db.session.add(novo_fornecedor)
        db.session.commit()
        return jsonify({"message": "Fornecedor adicionado com sucesso!", "fornecedor": novo_fornecedor.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        if "Duplicate entry" in str(e) and "for key 'fornecedores.nome'" in str(e):
            return jsonify({"message": "Erro: Nome de fornecedor já existe. Por favor, use um nome único."}), 409
        if "Duplicate entry" in str(e) and "for key 'fornecedores.cnpj'" in str(e):
            return jsonify({"message": "Erro: CNPJ de fornecedor já existe. Por favor, use um CNPJ único."}), 409
        return jsonify({"message": f"Erro ao adicionar fornecedor: {str(e)}"}), 500

@app.route('/fornecedores', methods=['GET'])
@jwt_required() # Protege a rota de listar fornecedores
def get_fornecedores():
    query = Fornecedor.query

    search_term = request.args.get('search', type=str)
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)

    if search_term:
        query = query.filter(
            (Fornecedor.nome.ilike(f'%{search_term}%')) |
            (Fornecedor.cnpj.ilike(f'%{search_term}%'))
        )
    
    paginated_fornecedores = query.paginate(page=page, per_page=per_page, error_out=False)

    fornecedores_json = [f.to_dict() for f in paginated_fornecedores.items]

    return jsonify({
        'items': fornecedores_json,
        'total_items': paginated_fornecedores.total,
        'total_pages': paginated_fornecedores.pages,
        'current_page': paginated_fornecedores.page,
        'per_page': paginated_fornecedores.per_page,
        'has_next': paginated_fornecedores.has_next,
        'has_prev': paginated_fornecedores.has_prev
    }), 200

@app.route('/fornecedores/<int:fornecedor_id>', methods=['GET'])
@jwt_required() # Protege a rota de obter fornecedor por ID
def get_fornecedor(fornecedor_id):
    fornecedor = Fornecedor.query.get(fornecedor_id)
    if fornecedor:
        return jsonify(fornecedor.to_dict()), 200
    return jsonify({"message": "Fornecedor não encontrado."}), 404

@app.route('/fornecedores/<int:fornecedor_id>', methods=['PUT'])
@jwt_required() # Protege a rota de atualizar fornecedor
def update_fornecedor(fornecedor_id):
    fornecedor = Fornecedor.query.get(fornecedor_id)
    if not fornecedor:
        return jsonify({"message": "Fornecedor não encontrado."}), 404

    data = request.get_json()
    if not data:
        return jsonify({"message": "Nenhum dado fornecido para atualização."}), 400
    
    fornecedor.nome = data.get('nome', fornecedor.nome)
    fornecedor.cnpj = data.get('cnpj', fornecedor.cnpj)
    fornecedor.email = data.get('email', fornecedor.email)
    fornecedor.telefone = data.get('telefone', fornecedor.telefone)
    fornecedor.endereco = data.get('endereco', fornecedor.endereco)

    try:
        db.session.commit()
        return jsonify({"message": "Fornecedor atualizado com sucesso!", "fornecedor": fornecedor.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        if "Duplicate entry" in str(e) and "for key 'fornecedores.nome'" in str(e):
            return jsonify({"message": "Erro: Nome de fornecedor já existe. Por favor, use um nome único."}), 409
        if "Duplicate entry" in str(e) and "for key 'fornecedores.cnpj'" in str(e):
            return jsonify({"message": "Erro: CNPJ de fornecedor já existe. Por favor, use um CNPJ único."}), 409
        return jsonify({"message": f"Erro ao atualizar fornecedor: {str(e)}"}), 500

@app.route('/fornecedores/<int:fornecedor_id>', methods=['DELETE'])
@jwt_required() # Protege a rota de deletar fornecedor
def delete_fornecedor(fornecedor_id):
    fornecedor = Fornecedor.query.get(fornecedor_id)
    if not fornecedor:
        return jsonify({"message": "Fornecedor não encontrado."}), 404
    
    produtos_vinculados = Produto.query.filter_by(fornecedor_id=fornecedor_id).first()
    if produtos_vinculados:
        return jsonify({"message": "Não é possível excluir o fornecedor. Existem produtos vinculados a ele."}), 400

    try:
        db.session.delete(fornecedor)
        db.session.commit()
        return jsonify({"message": "Fornecedor excluído com sucesso!"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Erro ao excluir fornecedor: {str(e)}"}), 500

# --- Rotas da API para Clientes ---
@app.route('/clientes', methods=['POST'])
@jwt_required() # Protege a rota de adicionar cliente
def add_cliente():
    data = request.get_json()
    if not data or not data.get('nome'):
        return jsonify({"message": "Nome do cliente é obrigatório."}), 400

    try:
        novo_cliente = Cliente(
            nome=data['nome'],
            cpf=data.get('cpf'),
            email=data.get('email'),
            telefone=data.get('telefone'),
            endereco=data.get('endereco')
        )
        db.session.add(novo_cliente)
        db.session.commit()
        return jsonify({"message": "Cliente adicionado com sucesso!", "cliente": novo_cliente.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        if "Duplicate entry" in str(e) and "for key 'clientes.cpf'" in str(e):
            return jsonify({"message": "Erro: CPF de cliente já existe. Por favor, use um CPF único."}), 409
        return jsonify({"message": f"Erro ao adicionar cliente: {str(e)}"}), 500

@app.route('/clientes', methods=['GET'])
@jwt_required() # Protege a rota de listar clientes
def get_clientes():
    query = Cliente.query
    search_term = request.args.get('search', type=str)
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)

    if search_term:
        query = query.filter(
            (Cliente.nome.ilike(f'%{search_term}%')) |
            (Cliente.cpf.ilike(f'%{search_term}%'))
        )
    
    paginated_clientes = query.paginate(page=page, per_page=per_page, error_out=False)

    clientes_json = [c.to_dict() for c in paginated_clientes.items]

    return jsonify({
        'items': clientes_json,
        'total_items': paginated_clientes.total,
        'total_pages': paginated_clientes.pages,
        'current_page': paginated_clientes.page,
        'per_page': paginated_clientes.per_page,
        'has_next': paginated_clientes.has_next,
        'has_prev': paginated_clientes.has_prev
    }), 200

@app.route('/clientes/<int:cliente_id>', methods=['GET'])
@jwt_required() # Protege a rota de obter cliente por ID
def get_cliente(cliente_id):
    cliente = Cliente.query.get(cliente_id)
    if cliente:
        return jsonify(cliente.to_dict()), 200
    return jsonify({"message": "Cliente não encontrado."}), 404

@app.route('/clientes/<int:cliente_id>', methods=['PUT'])
@jwt_required() # Protege a rota de atualizar cliente
def update_cliente(cliente_id):
    cliente = Cliente.query.get(cliente_id)
    if not cliente:
        return jsonify({"message": "Cliente não encontrado."}), 404

    data = request.get_json()
    if not data:
        return jsonify({"message": "Nenhum dado fornecido para atualização."}), 400
    
    cliente.nome = data.get('nome', cliente.nome)
    cliente.cpf = data.get('cpf', cliente.cpf)
    cliente.email = data.get('email', cliente.email)
    cliente.telefone = data.get('telefone', cliente.telefone)
    cliente.endereco = data.get('endereco', cliente.endereco)

    try:
        db.session.commit()
        return jsonify({"message": "Cliente atualizado com sucesso!", "cliente": cliente.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        if "Duplicate entry" in str(e) and "for key 'clientes.cpf'" in str(e):
            return jsonify({"message": "Erro: CPF de cliente já existe. Por favor, use um CPF único."}), 409
        return jsonify({"message": f"Erro ao atualizar cliente: {str(e)}"}), 500

@app.route('/clientes/<int:cliente_id>', methods=['DELETE'])
@jwt_required() # Protege a rota de deletar cliente
def delete_cliente(cliente_id):
    cliente = Cliente.query.get(cliente_id)
    if not cliente:
        return jsonify({"message": "Cliente não encontrado."}), 404
    
    movimentacoes_vinculadas = Movimentacao.query.filter_by(cliente_id=cliente_id).first()
    if movimentacoes_vinculadas:
        return jsonify({"message": "Não é possível excluir o cliente. Existem movimentações de saída vinculadas a ele."}), 400

    try:
        db.session.delete(cliente)
        db.session.commit()
        return jsonify({"message": "Cliente excluído com sucesso!"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Erro ao excluir cliente: {str(e)}"}), 500

# --- Execução do Aplicativo Flask ---
if __name__ == '__main__':
    app.run(debug=True, port=5000)

# ---