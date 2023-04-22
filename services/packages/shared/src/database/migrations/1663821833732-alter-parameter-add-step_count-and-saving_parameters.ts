import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class alterParameterAddStepCountAndSavingParameters1663821833732 implements MigrationInterface {
    private tableName = 'parameter';

    private columns = {
        stepCount: 'step_count',
        savingParameters: 'saving_parameters',
    };

    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasStepCountColumn = await queryRunner.hasColumn(this.tableName, this.columns.stepCount);
        if (hasStepCountColumn) {
            return;
        }
        await queryRunner.addColumn(
            this.tableName,
            new TableColumn({
                name: this.columns.stepCount,
                type: 'json',
                isNullable: true,
            }),
        );
        const hasSavingParametersColumn = await queryRunner.hasColumn(this.tableName, this.columns.savingParameters);
        if (hasSavingParametersColumn) {
            return;
        }
        await queryRunner.addColumn(
            this.tableName,
            new TableColumn({
                name: this.columns.savingParameters,
                type: 'json',
                isNullable: true,
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasStepCountColumn = await queryRunner.hasColumn(this.tableName, this.columns.stepCount);
        if (hasStepCountColumn) {
            await queryRunner.dropColumn(this.tableName, this.columns.stepCount);
        }
        const hasSavingParametersColumn = await queryRunner.hasColumn(this.tableName, this.columns.savingParameters);
        if (hasSavingParametersColumn) {
            await queryRunner.dropColumn(this.tableName, this.columns.savingParameters);
        }
    }
}
