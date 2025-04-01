#!/usr/bin/env node

import { Command } from 'commander';
import { DataMigrationService } from '../../../services/data-migration-service';
import { schemaRegistry } from '../schema';

// 创建命令行程序
const program = new Command();

// 设置程序信息
program
  .name('migration-cli')
  .description('数据库迁移命令行工具')
  .version('1.0.0');

// 获取所有表名
const getAllTableNames = (): string[] => {
  return schemaRegistry.getAllSchemas().map(schema => schema.name);
};

// 迁移命令：从Mock数据迁移到本地数据库
program
  .command('mock-to-local')
  .description('将Mock数据迁移到本地数据库')
  .option('-t, --tables <tables>', '要迁移的表，用逗号分隔')
  .option('--mock-type <type>', 'Mock数据库类型', 'mock-indexeddb')
  .option('--local-type <type>', '本地数据库类型', 'indexeddb')
  .action(async (options) => {
    try {
      console.log('开始从Mock数据迁移到本地数据库...');
      
      // 解析表名
      const tables = options.tables ? options.tables.split(',') : undefined;
      
      // 执行迁移
      const migrationService = DataMigrationService.getInstance();
      const result = await migrationService.migrateFromMockToLocal({
        tables,
        mockDbType: options.mockType,
        localDbType: options.localType
      });
      
      // 输出结果
      if (result.success) {
        console.log('\n✅ 数据迁移成功!');
        console.log(`总记录数: ${result.totalRecords}`);
        console.log(`成功迁移: ${result.migratedRecords}`);
        console.log(`失败记录: ${result.failedRecords}`);
        
        // 输出每个表的迁移结果
        console.log('\n表迁移详情:');
        result.tables.forEach(table => {
          console.log(`- ${table.table}: 总计 ${table.totalRecords}, 成功 ${table.migratedRecords}, 失败 ${table.failedRecords}`);
          
          // 如果有错误，输出前几个错误
          if (table.errors.length > 0) {
            console.log(`  错误示例:`);
            table.errors.slice(0, 3).forEach((err, index) => {
              console.log(`  ${index + 1}. ${err.error}`);
            });
            
            if (table.errors.length > 3) {
              console.log(`  ... 还有 ${table.errors.length - 3} 个错误未显示`);
            }
          }
        });
      } else {
        console.error('\n❌ 数据迁移失败!');
        console.error(`错误: ${result.error}`);
      }
    } catch (error) {
      console.error('执行迁移命令时出错:', error);
      process.exit(1);
    }
  });

// 验证命令：验证迁移结果
program
  .command('validate')
  .description('验证数据迁移结果')
  .requiredOption('-s, --source <type>', '源数据库类型')
  .requiredOption('-t, --target <type>', '目标数据库类型')
  .option('--tables <tables>', '要验证的表，用逗号分隔')
  .action(async (options) => {
    try {
      console.log('开始验证数据迁移结果...');
      
      // 解析表名
      const tables = options.tables 
        ? options.tables.split(',') 
        : getAllTableNames();
      
      // 执行验证
      const migrationService = DataMigrationService.getInstance();
      const success = await migrationService.validateMigration({
        sourceDbType: options.source,
        targetDbType: options.target,
        tables
      });
      
      // 输出结果
      if (success) {
        console.log('\n✅ 验证成功! 所有数据都已正确迁移。');
      } else {
        console.error('\n❌ 验证失败! 部分数据可能未正确迁移。');
      }
    } catch (error) {
      console.error('执行验证命令时出错:', error);
      process.exit(1);
    }
  });

// 列出表命令
program
  .command('list-tables')
  .description('列出所有可迁移的表')
  .action(() => {
    const tables = getAllTableNames();
    console.log('可迁移的表:');
    tables.forEach(table => console.log(`- ${table}`));
  });

// 解析命令行参数
program.parse(process.argv);