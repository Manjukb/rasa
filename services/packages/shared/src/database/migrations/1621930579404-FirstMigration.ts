import { MigrationInterface, QueryRunner } from 'typeorm';

export class FirstMigration1621930579404 implements MigrationInterface {
    name = 'FirstMigration1621930579404';

    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasUserTable = await queryRunner.hasTable('user');
        if (hasUserTable) {
            return;
        }
        await queryRunner.query(
            `CREATE TABLE "public"."alembic_version" ("version_num" character varying(32) NOT NULL, CONSTRAINT "PK_6cfefda855be7a94f71ece65e5b" PRIMARY KEY ("version_num"))`,
        );
        await queryRunner.query(
            `CREATE UNIQUE INDEX "alembic_version_pkc" ON "public"."alembic_version" ("version_num") `,
        );
        await queryRunner.query(
            `CREATE TABLE "public"."bot_domain" ("created_date" TIMESTAMP NOT NULL DEFAULT now(), "updated_date" TIMESTAMP NOT NULL DEFAULT now(), "id" SERIAL NOT NULL, "bot_domain" json, "organisation_id" character varying(40), CONSTRAINT "PK_34a62cbf4c618771da272e02f2d" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(`CREATE UNIQUE INDEX "bot_domain_pkey" ON "public"."bot_domain" ("id") `);
        await queryRunner.query(
            `CREATE TABLE "public"."payee" ("id" SERIAL NOT NULL, "created_date" TIMESTAMP NOT NULL, "updated_date" TIMESTAMP NOT NULL, "payee" json NOT NULL, "organisation_id" character varying(40), "brand_id" character varying(120), CONSTRAINT "PK_603c179caa547cc9cae3dd98e46" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(`CREATE UNIQUE INDEX "payee_pkey" ON "public"."payee" ("id") `);
        await queryRunner.query(
            `CREATE TABLE "public"."brand" ("id" SERIAL NOT NULL, "brand_id" character varying(120) NOT NULL, "brand_info" json NOT NULL, "created_date" TIMESTAMP NOT NULL, "updated_date" TIMESTAMP NOT NULL, "organisation_id" character varying(40), CONSTRAINT "UQ_16ad3f14c572f3955bf7aaab2fe" UNIQUE ("brand_id"), CONSTRAINT "PK_78c1c9a2f36ac2afebe6c4804cc" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(`CREATE UNIQUE INDEX "brand_pkey" ON "public"."brand" ("id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "brand_brand_id_key" ON "public"."brand" ("brand_id") `);
        await queryRunner.query(
            `CREATE TABLE "public"."negotiation_evaluation_metric" ("created_date" TIMESTAMP NOT NULL DEFAULT now(), "updated_date" TIMESTAMP NOT NULL DEFAULT now(), "id" SERIAL NOT NULL, "metric_id" character varying(80) NOT NULL, "negotiation_metric" json NOT NULL, "business_type" character varying(40), "tenant_id" character varying(40), "organisation_id" character varying(40), CONSTRAINT "PK_5678c5396d4a7a802abf2ff1f79" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE INDEX "bot_tenant_id_index_key" ON "public"."negotiation_evaluation_metric" ("tenant_id") `,
        );
        await queryRunner.query(
            `CREATE UNIQUE INDEX "negotiation_evaluation_metric_pkey" ON "public"."negotiation_evaluation_metric" ("id") `,
        );
        await queryRunner.query(
            `CREATE INDEX "bot_business_type_index_key" ON "public"."negotiation_evaluation_metric" ("business_type") `,
        );
        await queryRunner.query(
            `CREATE TABLE "public"."negotiation" ("id" character varying(40) NOT NULL, "customer_id" character varying(40) NOT NULL, "product_id" character varying(40) NOT NULL, "channel_id" character varying(64) NOT NULL, "round" smallint NOT NULL DEFAULT 0, "is_bot_active" boolean NOT NULL DEFAULT true, "session" json NOT NULL, "status" character varying(20) NOT NULL, "created_date" TIMESTAMP NOT NULL DEFAULT now(), "updated_date" TIMESTAMP NOT NULL DEFAULT now(), "product_code" character varying(40) NOT NULL, CONSTRAINT "PK_331dbe0f6f7153fe07ef94eb4a5" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE INDEX "negotiation_product_id_index" ON "public"."negotiation" ("product_id") `,
        );
        await queryRunner.query(
            `CREATE INDEX "negotiation_product_code_index" ON "public"."negotiation" ("product_code") `,
        );
        await queryRunner.query(
            `CREATE INDEX "negotiation_customer_id_index" ON "public"."negotiation" ("customer_id") `,
        );
        await queryRunner.query(
            `CREATE TABLE "public"."parameter" ("id" character varying(40) NOT NULL, "product_id" character varying(120) NOT NULL, "parameter" json NOT NULL, "created_date" TIMESTAMP NOT NULL DEFAULT now(), "updated_date" TIMESTAMP NOT NULL DEFAULT now(), "organisation_id" character varying(40), CONSTRAINT "PK_35b132cd97b1b526028439b8590" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(`CREATE INDEX "parameter_product_id" ON "public"."parameter" ("product_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "parameter_pkey" ON "public"."parameter" ("id") `);
        await queryRunner.query(
            `CREATE TABLE "public"."product" ("id" character varying(40) NOT NULL, "product_code" character varying(120) NOT NULL, "product_info" json NOT NULL, "created_date" TIMESTAMP NOT NULL DEFAULT now(), "updated_date" TIMESTAMP NOT NULL DEFAULT now(), "tenant_id" character varying(36), "organisation_id" character varying(40), CONSTRAINT "PK_da169ec9c2ae25fb86633d10f9f" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(`CREATE INDEX "product_tenant_id" ON "public"."product" ("tenant_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "product_pkey" ON "public"."product" ("id") `);
        await queryRunner.query(`CREATE TYPE public.tenant_user_role_enum AS ENUM (
            'tenant_admin',
            'tenant_user'
        )`);

        await queryRunner.query(
            `CREATE TABLE "public"."tenant_user" ("id" character varying(40) NOT NULL, "name" character varying(128) NOT NULL, "identifier" character varying(128) NOT NULL, "role" "public"."tenant_user_role_enum" NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "tenant_id" character varying(36) NOT NULL, "created_date" TIMESTAMP NOT NULL DEFAULT now(), "updated_date" TIMESTAMP NOT NULL DEFAULT now(), "deleted_date" TIMESTAMP, CONSTRAINT "UQ_7f7a6ad860b7ad35e7cf9949559" UNIQUE ("identifier"), CONSTRAINT "UQ_fd45c3869a4cf584a638ee685a8" UNIQUE ("tenant_id"), CONSTRAINT "PK_d6d0351e44dbe2a42617311c417" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE UNIQUE INDEX "tenant_user_tenant_id_username_uq" ON "public"."tenant_user" ("identifier", "tenant_id") `,
        );
        await queryRunner.query(`CREATE TYPE public.tenant_business_type_enum AS ENUM (
            'procurement',
            'sales',
            'collections'
        )`);
        await queryRunner.query(
            `CREATE TABLE "public"."tenant" ("id" character varying(40) NOT NULL, "name" character varying(128) NOT NULL, "business_type" "public"."tenant_business_type_enum" NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "is_bot_active" boolean NOT NULL DEFAULT true, "created_date" TIMESTAMP NOT NULL DEFAULT now(), "updated_date" TIMESTAMP NOT NULL DEFAULT now(), "deleted_date" TIMESTAMP, "organisation_id" character varying(40), CONSTRAINT "PK_268d457e0f30670cba4b8f2067e" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TABLE "public"."customer" ("id" character varying(40) NOT NULL, "name" character varying(128) NOT NULL, "identifier" character varying(128) NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_date" TIMESTAMP NOT NULL DEFAULT now(), "updated_date" TIMESTAMP NOT NULL DEFAULT now(), "tenant_id" character varying(40), "organisation_id" character varying(40), CONSTRAINT "PK_493862f6fb77845712126f204eb" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TABLE "public"."epd_negotiation_session" ("created_date" TIMESTAMP NOT NULL DEFAULT now(), "updated_date" TIMESTAMP NOT NULL DEFAULT now(), "id" SERIAL NOT NULL, "brand_id" character varying(80) NOT NULL, "session_id" character varying(80) NOT NULL, "negotiation_session" json NOT NULL DEFAULT '{}', "customer_email" character varying(80) NOT NULL DEFAULT 'test@test.co', "session_status" character varying(50) NOT NULL DEFAULT 'negotiate', "active" boolean, "organisation_id" character varying(40), CONSTRAINT "PK_c715329357c0061dc8a525e3227" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE UNIQUE INDEX "epd_negotiation_session_pkey" ON "public"."epd_negotiation_session" ("id") `,
        );
        await queryRunner.query(
            `CREATE TABLE "public"."epd_parameter" ("id" SERIAL NOT NULL, "brand_id" character varying(120) NOT NULL, "epd_parameter" json NOT NULL, "created_date" TIMESTAMP NOT NULL, "updated_date" TIMESTAMP NOT NULL, "organisation_id" character varying(40), CONSTRAINT "PK_5c195992ba352bf3d87e9f4420d" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(`CREATE UNIQUE INDEX "epd_parameter_pkey" ON "public"."epd_parameter" ("id") `);
        await queryRunner.query(
            `CREATE TABLE "public"."message_template" ("created_date" TIMESTAMP NOT NULL DEFAULT now(), "updated_date" TIMESTAMP NOT NULL DEFAULT now(), "id" SERIAL NOT NULL, "bot_template" json, "organisation_id" character varying(40), CONSTRAINT "PK_29e7aa2eca6965c12da85b0af02" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(`CREATE UNIQUE INDEX "message_template_pkey" ON "public"."message_template" ("id") `);
        await queryRunner.query(
            `CREATE TABLE "public"."product_negotiation_session" ("created_date" TIMESTAMP NOT NULL DEFAULT now(), "updated_date" TIMESTAMP NOT NULL DEFAULT now(), "id" SERIAL NOT NULL, "product_id" character varying(80) NOT NULL, "session_id" character varying(256) NOT NULL, "negotiation_session" json NOT NULL DEFAULT '{}', "customer_email" character varying(80) NOT NULL DEFAULT 'test@test.co', "session_status" character varying(50) NOT NULL DEFAULT 'negotiate', "organisation_id" character varying(40), CONSTRAINT "PK_73cefa9628c593deb7d854af470" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE UNIQUE INDEX "product_negotiation_session_pkey" ON "public"."product_negotiation_session" ("id") `,
        );
        await queryRunner.query(
            `CREATE TABLE "public"."setting" ("id" SERIAL NOT NULL, "settings" json NOT NULL, "created_date" TIMESTAMP NOT NULL DEFAULT now(), "updated_date" TIMESTAMP NOT NULL DEFAULT now(), "organisation_id" character varying(40), CONSTRAINT "PK_108cf58dabd2ca8583ef34a4d77" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TYPE "public"."user_authority_enum" AS ENUM('super_admin', 'org_admin', 'org_user', 'enterprise_admin', 'enterprise_user', 'saas_admin')`,
        );
        await queryRunner.query(
            `CREATE TABLE "public"."user" ("id" SERIAL NOT NULL, "user_id" character varying(40) NOT NULL, "authority" "public"."user_authority_enum" NOT NULL, "password_hash" character varying(128) NOT NULL, "user_info" json NOT NULL, "created_date" TIMESTAMP NOT NULL DEFAULT now(), "updated_date" TIMESTAMP NOT NULL DEFAULT now(), "user_status" boolean, "name" character varying(40), "created_by" character varying(40), "updated_by" character varying(40), "password_key" character varying(40), "password_key_valid_till" TIMESTAMP, "business_type" character varying(64), "email" character varying(40), "organisation_id" character varying(40), CONSTRAINT "UQ_1252c2d719e83c1eec01d9128eb" UNIQUE ("user_id"), CONSTRAINT "UQ_b7a5e4a3b174e954b2dabf2ef9e" UNIQUE ("email"), CONSTRAINT "PK_03b91d2b8321aa7ba32257dc321" PRIMARY KEY ("id"))`,
        );

        await queryRunner.query(`CREATE TYPE public.organisation_client_type_enum AS ENUM (
            'enterprise',
            'saas-based'
        )`);
        await queryRunner.query(`CREATE UNIQUE INDEX "user_user_id_key" ON "public"."user" ("user_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "user_pkey" ON "public"."user" ("id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_e12875dfb3b1d92d7d7c5377e22" ON "public"."user" ("email") `);
        await queryRunner.query(
            `CREATE TABLE "public"."organisation" ("id" SERIAL NOT NULL, "organisation_id" character varying(40) NOT NULL, "organisation_info" json NOT NULL, "created_date" TIMESTAMP NOT NULL DEFAULT now(), "updated_date" TIMESTAMP NOT NULL DEFAULT now(), "business_type" character varying(64), "client_type" "public"."organisation_client_type_enum", "is_active" boolean NOT NULL DEFAULT true, "created_by" character varying(40), "updated_by" character varying(40), "name" character varying(40), "domains" character varying(512), CONSTRAINT "UQ_489162d724c6d53a6c1ad05463b" UNIQUE ("organisation_id"), CONSTRAINT "UQ_5a36ccb0a3051ce4407fc3c33ac" UNIQUE ("name"), CONSTRAINT "PK_29b4ea986819a26baeebbf47645" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE UNIQUE INDEX "organisation_organisation_id_key" ON "public"."organisation" ("organisation_id") `,
        );
        await queryRunner.query(
            `CREATE UNIQUE INDEX "UQ_d9428f9c8e3052d6617e3aab0ed" ON "public"."organisation" ("name") `,
        );
        await queryRunner.query(`CREATE UNIQUE INDEX "organisation_pkey" ON "public"."organisation" ("id") `);
        await queryRunner.query(
            `CREATE TYPE "public"."api_key_authority_enum" AS ENUM('super_admin', 'org_admin', 'org_user', 'enterprise_admin', 'enterprise_user', 'saas_admin', 'tenant_admin')`,
        );

        await queryRunner.query(`CREATE TYPE public.api_key_business_type_enum AS ENUM (
            'collections',
            'procurement',
            'sales'
        )`);

        await queryRunner.query(
            `CREATE TABLE "public"."api_key" ("id" SERIAL NOT NULL, "user_id" character varying(20) NOT NULL, "api_key" character varying(20), "authority" "public"."api_key_authority_enum" NOT NULL, "issued_date" TIMESTAMP NOT NULL, "expired_date" TIMESTAMP NOT NULL, "business_type" "public"."api_key_business_type_enum", "is_active" boolean DEFAULT true, "deleted_date" TIMESTAMP, "organisation_id" character varying(40), CONSTRAINT "PK_20ee0c7d51a622207b19bdfe0f9" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(`CREATE UNIQUE INDEX "api_key_pkey" ON "public"."api_key" ("id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "api_key_unique_api_key" ON "public"."api_key" ("api_key") `);
        await queryRunner.query(
            `ALTER TABLE "public"."bot_domain" ADD CONSTRAINT "FK_6381939b950b3b3f5f5029f7df9" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisation"("organisation_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "public"."payee" ADD CONSTRAINT "FK_1f64f1edd9bf398920c58ca9517" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisation"("organisation_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "public"."payee" ADD CONSTRAINT "FK_f6c5faa1372824af47bcdd0426d" FOREIGN KEY ("brand_id") REFERENCES "public"."brand"("brand_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "public"."brand" ADD CONSTRAINT "FK_7e6ebe9f457d8827947b374ff49" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisation"("organisation_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "public"."negotiation_evaluation_metric" ADD CONSTRAINT "FK_f9ce6a10bf376d15f0d3d34b0af" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "public"."negotiation_evaluation_metric" ADD CONSTRAINT "FK_49843c30aadecd262fbb2d4c355" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisation"("organisation_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "public"."negotiation" ADD CONSTRAINT "FK_5bf2ccab95b4840c3624cf1b145" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "public"."negotiation" ADD CONSTRAINT "FK_cc389c71a77ebbd2a723324e319" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "public"."parameter" ADD CONSTRAINT "FK_5d9d0c455037ae26dc6d7a06dd9" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "public"."parameter" ADD CONSTRAINT "FK_990929cbd2289cf4b482670e35f" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisation"("organisation_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "public"."product" ADD CONSTRAINT "FK_fde686f0bf01216fac7e23d90d5" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "public"."product" ADD CONSTRAINT "FK_b88ccb9292b96736831812397c0" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisation"("organisation_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "public"."tenant_user" ADD CONSTRAINT "FK_fd45c3869a4cf584a638ee685a8" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "public"."tenant" ADD CONSTRAINT "FK_265f9c4d281d31aa356fc2797e1" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisation"("organisation_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "public"."customer" ADD CONSTRAINT "FK_39195a9eb2e0a3b20e58a622380" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "public"."customer" ADD CONSTRAINT "FK_500d2fb979e4aa8c9e3f3954115" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisation"("organisation_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "public"."epd_negotiation_session" ADD CONSTRAINT "FK_1889d6ab37faf983de288cd592d" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisation"("organisation_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "public"."epd_parameter" ADD CONSTRAINT "FK_e8d12f8aa581e2480703a568a31" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisation"("organisation_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "public"."message_template" ADD CONSTRAINT "FK_e7297ac6ce2e52d6375dece2399" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisation"("organisation_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "public"."product_negotiation_session" ADD CONSTRAINT "FK_923e5d3b8f1a5c714917e2e4b31" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisation"("organisation_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "public"."setting" ADD CONSTRAINT "FK_74a848f39669bee41fb577f16bf" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisation"("organisation_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "public"."user" ADD CONSTRAINT "FK_0a79598b594426dd1c615e75004" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisation"("organisation_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "public"."api_key" ADD CONSTRAINT "FK_bed9e25ce3a6fd95ab0b63e03a5" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisation"("organisation_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // for safer side, we are blocking to delete all the tables
        const safe = true;
        if (safe) {
            return;
        }
        await queryRunner.query(`ALTER TABLE "public"."api_key" DROP CONSTRAINT "FK_bed9e25ce3a6fd95ab0b63e03a5"`);
        await queryRunner.query(`ALTER TABLE "public"."user" DROP CONSTRAINT "FK_0a79598b594426dd1c615e75004"`);
        await queryRunner.query(`ALTER TABLE "public"."setting" DROP CONSTRAINT "FK_74a848f39669bee41fb577f16bf"`);
        await queryRunner.query(
            `ALTER TABLE "public"."product_negotiation_session" DROP CONSTRAINT "FK_923e5d3b8f1a5c714917e2e4b31"`,
        );
        await queryRunner.query(
            `ALTER TABLE "public"."message_template" DROP CONSTRAINT "FK_e7297ac6ce2e52d6375dece2399"`,
        );
        await queryRunner.query(
            `ALTER TABLE "public"."epd_parameter" DROP CONSTRAINT "FK_e8d12f8aa581e2480703a568a31"`,
        );
        await queryRunner.query(
            `ALTER TABLE "public"."epd_negotiation_session" DROP CONSTRAINT "FK_1889d6ab37faf983de288cd592d"`,
        );
        await queryRunner.query(`ALTER TABLE "public"."customer" DROP CONSTRAINT "FK_500d2fb979e4aa8c9e3f3954115"`);
        await queryRunner.query(`ALTER TABLE "public"."customer" DROP CONSTRAINT "FK_39195a9eb2e0a3b20e58a622380"`);
        await queryRunner.query(`ALTER TABLE "public"."tenant" DROP CONSTRAINT "FK_265f9c4d281d31aa356fc2797e1"`);
        await queryRunner.query(`ALTER TABLE "public"."tenant_user" DROP CONSTRAINT "FK_fd45c3869a4cf584a638ee685a8"`);
        await queryRunner.query(`ALTER TABLE "public"."product" DROP CONSTRAINT "FK_b88ccb9292b96736831812397c0"`);
        await queryRunner.query(`ALTER TABLE "public"."product" DROP CONSTRAINT "FK_fde686f0bf01216fac7e23d90d5"`);
        await queryRunner.query(`ALTER TABLE "public"."parameter" DROP CONSTRAINT "FK_990929cbd2289cf4b482670e35f"`);
        await queryRunner.query(`ALTER TABLE "public"."parameter" DROP CONSTRAINT "FK_5d9d0c455037ae26dc6d7a06dd9"`);
        await queryRunner.query(`ALTER TABLE "public"."negotiation" DROP CONSTRAINT "FK_cc389c71a77ebbd2a723324e319"`);
        await queryRunner.query(`ALTER TABLE "public"."negotiation" DROP CONSTRAINT "FK_5bf2ccab95b4840c3624cf1b145"`);
        await queryRunner.query(
            `ALTER TABLE "public"."negotiation_evaluation_metric" DROP CONSTRAINT "FK_49843c30aadecd262fbb2d4c355"`,
        );
        await queryRunner.query(
            `ALTER TABLE "public"."negotiation_evaluation_metric" DROP CONSTRAINT "FK_f9ce6a10bf376d15f0d3d34b0af"`,
        );
        await queryRunner.query(`ALTER TABLE "public"."brand" DROP CONSTRAINT "FK_7e6ebe9f457d8827947b374ff49"`);
        await queryRunner.query(`ALTER TABLE "public"."payee" DROP CONSTRAINT "FK_f6c5faa1372824af47bcdd0426d"`);
        await queryRunner.query(`ALTER TABLE "public"."payee" DROP CONSTRAINT "FK_1f64f1edd9bf398920c58ca9517"`);
        await queryRunner.query(`ALTER TABLE "public"."bot_domain" DROP CONSTRAINT "FK_6381939b950b3b3f5f5029f7df9"`);
        await queryRunner.query(`DROP TABLE "public"."migrations"`);
        await queryRunner.query(`DROP INDEX "public"."api_key_unique_api_key"`);
        await queryRunner.query(`DROP INDEX "public"."api_key_pkey"`);
        await queryRunner.query(`DROP TABLE "public"."api_key"`);
        await queryRunner.query(`DROP TYPE "public"."api_key_authority_enum"`);
        await queryRunner.query(`DROP INDEX "public"."organisation_pkey"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_d9428f9c8e3052d6617e3aab0ed"`);
        await queryRunner.query(`DROP INDEX "public"."organisation_organisation_id_key"`);
        await queryRunner.query(`DROP TABLE "public"."organisation"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_e12875dfb3b1d92d7d7c5377e22"`);
        await queryRunner.query(`DROP INDEX "public"."user_pkey"`);
        await queryRunner.query(`DROP INDEX "public"."user_user_id_key"`);
        await queryRunner.query(`DROP TABLE "public"."user"`);
        await queryRunner.query(`DROP TYPE "public"."user_authority_enum"`);
        await queryRunner.query(`DROP TABLE "public"."setting"`);
        await queryRunner.query(`DROP INDEX "public"."product_negotiation_session_pkey"`);
        await queryRunner.query(`DROP TABLE "public"."product_negotiation_session"`);
        await queryRunner.query(`DROP INDEX "public"."message_template_pkey"`);
        await queryRunner.query(`DROP TABLE "public"."message_template"`);
        await queryRunner.query(`DROP INDEX "public"."epd_parameter_pkey"`);
        await queryRunner.query(`DROP TABLE "public"."epd_parameter"`);
        await queryRunner.query(`DROP INDEX "public"."epd_negotiation_session_pkey"`);
        await queryRunner.query(`DROP TABLE "public"."epd_negotiation_session"`);
        await queryRunner.query(`DROP TABLE "public"."customer"`);
        await queryRunner.query(`DROP TABLE "public"."tenant"`);
        await queryRunner.query(`DROP INDEX "public"."tenant_user_tenant_id_username_uq"`);
        await queryRunner.query(`DROP TABLE "public"."tenant_user"`);
        await queryRunner.query(`DROP INDEX "public"."product_pkey"`);
        await queryRunner.query(`DROP INDEX "public"."product_tenant_id"`);
        await queryRunner.query(`DROP TABLE "public"."product"`);
        await queryRunner.query(`DROP INDEX "public"."parameter_pkey"`);
        await queryRunner.query(`DROP INDEX "public"."parameter_product_id"`);
        await queryRunner.query(`DROP TABLE "public"."parameter"`);
        await queryRunner.query(`DROP INDEX "public"."negotiation_customer_id_index"`);
        await queryRunner.query(`DROP INDEX "public"."negotiation_product_code_index"`);
        await queryRunner.query(`DROP INDEX "public"."negotiation_product_id_index"`);
        await queryRunner.query(`DROP TABLE "public"."negotiation"`);
        await queryRunner.query(`DROP INDEX "public"."bot_business_type_index_key"`);
        await queryRunner.query(`DROP INDEX "public"."negotiation_evaluation_metric_pkey"`);
        await queryRunner.query(`DROP INDEX "public"."bot_tenant_id_index_key"`);
        await queryRunner.query(`DROP TABLE "public"."negotiation_evaluation_metric"`);
        await queryRunner.query(`DROP INDEX "public"."brand_brand_id_key"`);
        await queryRunner.query(`DROP INDEX "public"."brand_pkey"`);
        await queryRunner.query(`DROP TABLE "public"."brand"`);
        await queryRunner.query(`DROP INDEX "public"."payee_pkey"`);
        await queryRunner.query(`DROP TABLE "public"."payee"`);
        await queryRunner.query(`DROP INDEX "public"."bot_domain_pkey"`);
        await queryRunner.query(`DROP TABLE "public"."bot_domain"`);
        await queryRunner.query(`DROP INDEX "public"."alembic_version_pkc"`);
        await queryRunner.query(`DROP TABLE "public"."alembic_version"`);
    }
}
