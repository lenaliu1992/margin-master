import * as XLSX from 'xlsx';
import type { ImportError, ImportResult, ImportWarning } from '@/types';

export interface ExcelDish {
  id: string;
  name: string;
  cost: number;
  price?: number;
  categoryName?: string;
}

export interface ExcelMealAnalysis {
  id: string;
  name: string;
  dishIds: string[];
  standardPrice: number;
  promoPrice1: number;
  promoPrice2?: number;
  totalCost: number;
  totalOriginalPrice: number;
  promoMargin1: number;
  promoMargin2?: number;
  finalMargin?: number;
}

interface ExcelMeal {
  name: string;
  dishIds: string[];
  standardPrice: number;
  promoPrice1: number;
  promoPrice2?: number;
}

interface ExcelRowBase {
  序号: number;
  套餐名称: string;
  菜品名称: string;
  菜品单价: string;
  菜品成本: string;
  数量: number;
  菜品小计: string;
  套餐原价: string;
  秒杀价1: string;
  秒杀毛利率1: string;
}

interface ExcelRowWithPromo2 extends ExcelRowBase {
  官方补贴金额: string;
  补贴后毛利率: string;
  最终到手价: string;
  最终毛利率: string;
}

type ExcelRow = ExcelRowBase | ExcelRowWithPromo2;

export interface ParsedDishImportResult {
  success: boolean;
  dishes: ExcelDish[];
  duplicates: Array<{
    name: string;
    existing: ExcelDish;
    new: Omit<ExcelDish, 'id'>;
  }>;
  errors: string[];
}

const transformMealsToExcelRows = (
  meals: ExcelMealAnalysis[],
  dishes: ExcelDish[]
): ExcelRow[] => {
  const rows: ExcelRow[] = [];
  const hasAnyPromoPrice2 = meals.some((meal) => meal.promoPrice2 !== undefined);

  meals.forEach((meal, mealIndex) => {
    const serialNumber = mealIndex + 1;
    const dishCounts = meal.dishIds.reduce((acc, id) => {
      acc[id] = (acc[id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(dishCounts).forEach(([dishId, quantity]) => {
      const dish = dishes.find((item) => item.id === dishId);
      if (!dish) return;

      const subtotal = (dish.price || 0) * quantity;
      const baseRow: ExcelRowBase = {
        序号: serialNumber,
        套餐名称: meal.name,
        菜品名称: dish.name,
        菜品单价: dish.price ? `¥${dish.price.toFixed(2)}` : '-',
        菜品成本: `¥${dish.cost.toFixed(2)}`,
        数量: quantity,
        菜品小计: `¥${subtotal.toFixed(2)}`,
        套餐原价: `¥${meal.totalOriginalPrice.toFixed(2)}`,
        秒杀价1: `¥${meal.promoPrice1.toFixed(2)}`,
        秒杀毛利率1: `${meal.promoMargin1.toFixed(2)}%`,
      };

      if (hasAnyPromoPrice2) {
        const finalPrice = meal.promoPrice2 !== undefined ? meal.promoPrice1 - meal.promoPrice2 : undefined;
        rows.push({
          ...baseRow,
          官方补贴金额: meal.promoPrice2 !== undefined ? `¥${meal.promoPrice2.toFixed(2)}` : '-',
          补贴后毛利率:
            meal.promoPrice2 !== undefined && meal.promoMargin2 !== undefined
              ? `${meal.promoMargin2.toFixed(2)}%`
              : '-',
          最终到手价: finalPrice !== undefined ? `¥${finalPrice.toFixed(2)}` : '-',
          最终毛利率: meal.finalMargin !== undefined ? `${meal.finalMargin.toFixed(2)}%` : '-',
        });
      } else {
        rows.push(baseRow);
      }
    });
  });

  return rows;
};

export const exportToExcel = (meals: ExcelMealAnalysis[], dishes: ExcelDish[]) => {
  const rows = transformMealsToExcelRows(meals, dishes);
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const hasAnyPromoPrice2 = meals.some((meal) => meal.promoPrice2 !== undefined);
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');

  for (let row = range.s.r; row <= range.e.r; row++) {
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = worksheet[cellAddress];
      if (!cell) continue;

      const headerCellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      const headerCell = worksheet[headerCellAddress];
      if (!headerCell) continue;

      const fieldName = headerCell.v;
      if (
        ['菜品单价', '菜品成本', '菜品小计', '套餐原价', '秒杀价1', '官方补贴金额', '最终到手价'].includes(
          fieldName
        ) &&
        row > 0 &&
        typeof cell.v === 'string'
      ) {
        const numericValue = parseFloat(cell.v.replace(/[¥\s]/g, ''));
        if (!Number.isNaN(numericValue)) {
          cell.v = numericValue;
          cell.t = 'n';
          cell.z = '"¥"#,##0.00';
        }
      }
    }
  }

  const merges: XLSX.Range[] = [];
  let currentRowIndex = 1;
  let index = 0;

  while (index < rows.length) {
    const currentMealName = rows[index].套餐名称;
    const startRow = currentRowIndex;
    let mealRowCount = 0;

    while (index < rows.length && rows[index].套餐名称 === currentMealName) {
      mealRowCount++;
      index++;
    }

    if (mealRowCount > 1) {
      const endRow = startRow + mealRowCount - 1;
      const columnsToMerge = hasAnyPromoPrice2 ? [0, 1, 7, 8, 9, 10, 11, 12, 13] : [0, 1, 7, 8, 9];

      columnsToMerge.forEach((colIndex) => {
        merges.push({
          s: { r: startRow, c: colIndex },
          e: { r: endRow, c: colIndex },
        });
      });
    }

    currentRowIndex += mealRowCount;
  }

  worksheet['!merges'] = merges;
  worksheet['!cols'] = hasAnyPromoPrice2
    ? [
        { wch: 8 },
        { wch: 20 },
        { wch: 25 },
        { wch: 12 },
        { wch: 12 },
        { wch: 8 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 14 },
        { wch: 14 },
        { wch: 14 },
        { wch: 14 },
      ]
    : [
        { wch: 8 },
        { wch: 20 },
        { wch: 25 },
        { wch: 12 },
        { wch: 12 },
        { wch: 8 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
      ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '套餐菜品明细');

  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const time = now.toTimeString().split(' ')[0].replace(/:/g, '-');
  XLSX.writeFile(workbook, `菜品毛利分析_${date}_${time}.xlsx`);
};

const fillMergedCells = (rows: Record<string, unknown>[], hasPromoPrice2Column: boolean) => {
  const result: Record<string, unknown>[] = [];
  let currentMealInfo: Record<string, unknown> = {};

  rows.forEach((row) => {
    const mealName = String(row.套餐名称 || '').trim();
    if (!mealName) {
      row.套餐名称 = currentMealInfo.套餐名称 || '';
      row.套餐原价 = currentMealInfo.套餐原价 || 0;
      row.秒杀价1 = currentMealInfo.秒杀价1 || 0;
      row.秒杀毛利率1 = currentMealInfo.秒杀毛利率1 || 0;

      if (hasPromoPrice2Column) {
        row.官方补贴金额 = currentMealInfo.官方补贴金额 || 0;
        row.补贴后毛利率 = currentMealInfo.补贴后毛利率 || 0;
      }
    } else {
      currentMealInfo = {
        套餐名称: row.套餐名称,
        套餐原价: row.套餐原价,
        秒杀价1: row.秒杀价1,
        秒杀毛利率1: row.秒杀毛利率1,
        官方补贴金额: row.官方补贴金额,
        补贴后毛利率: row.补贴后毛利率,
      };
    }

    result.push(row);
  });

  return result;
};

const parsePrice = (value: string | number | undefined): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[¥\s]/g, '');
    const parsed = parseFloat(cleaned);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const groupByMeal = (rows: Record<string, unknown>[]): Map<string, Record<string, unknown>[]> => {
  const groups = new Map<string, Record<string, unknown>[]>();
  rows.forEach((row) => {
    const mealName = String(row.套餐名称 || '').trim();
    if (!mealName) return;
    if (!groups.has(mealName)) {
      groups.set(mealName, []);
    }
    groups.get(mealName)?.push(row);
  });
  return groups;
};

export const importFromExcel = async (file: File, dishes: ExcelDish[]): Promise<ImportResult> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    if (workbook.SheetNames.length === 0) {
      return {
        success: false,
        meals: [],
        errors: [{ type: 'INVALID_DATA', message: 'Excel 文件中没有工作表' }],
        warnings: [],
      };
    }

    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

    if (rawData.length === 0) {
      return {
        success: false,
        meals: [],
        errors: [{ type: 'INVALID_DATA', message: '工作表中没有数据' }],
        warnings: [],
      };
    }

    const hasPromoPrice2Column = '官方补贴金额' in rawData[0] || '秒杀价2' in rawData[0];
    const filledRows = fillMergedCells(rawData, hasPromoPrice2Column);
    const mealGroups = groupByMeal(filledRows);

    const meals: ExcelMeal[] = [];
    const allErrors: ImportError[] = [];
    const allWarnings: ImportWarning[] = [];

    mealGroups.forEach((rows, mealName) => {
      const errors: ImportError[] = [];
      const warnings: ImportWarning[] = [];
      const dishIds: string[] = [];

      const firstRow = rows[0];
      const promoPrice1 = parsePrice(firstRow.秒杀价1 as string | number | undefined);
      const standardPrice = parsePrice(firstRow.套餐原价 as string | number | undefined);

      let promoPrice2: number | undefined;
      if (hasPromoPrice2Column) {
        const subsidyValue = (firstRow.官方补贴金额 || firstRow.秒杀价2) as string | number | undefined;
        const parsedValue = parsePrice(subsidyValue);
        promoPrice2 = parsedValue > 0 ? parsedValue : undefined;
      }

      if (!mealName || !promoPrice1) {
        allErrors.push({
          type: 'MISSING_REQUIRED_FIELD',
          mealName,
          message: '套餐缺少必需字段：套餐名称或秒杀价1',
        });
        return;
      }

      rows.forEach((row, rowIndex) => {
        const dishName = String(row.菜品名称 || '').trim();
        const quantity = parseInt(String(row.数量 || 1), 10) || 1;
        if (!dishName) return;

        const matchedDish = dishes.find((dish) => dish.name === dishName);
        if (!matchedDish) {
          errors.push({
            type: 'MISSING_DISH',
            mealName,
            dishName,
            message: `菜品库中未找到菜品: ${dishName}`,
            row: rowIndex + 2,
          });
          return;
        }

        const dishPrice = parsePrice(row.菜品单价 as string | number | undefined);
        const dishCost = parsePrice(row.菜品成本 as string | number | undefined);

        if (dishPrice > 0 && matchedDish.price && Math.abs(dishPrice - matchedDish.price) > 0.01) {
          warnings.push({
            type: 'PRICE_MISMATCH',
            mealName,
            dishName,
            message: '菜品单价不匹配',
            expected: matchedDish.price,
            actual: dishPrice,
          });
        }

        if (dishCost > 0 && Math.abs(dishCost - matchedDish.cost) > 0.01) {
          warnings.push({
            type: 'COST_MISMATCH',
            mealName,
            dishName,
            message: '菜品成本不匹配',
            expected: matchedDish.cost,
            actual: dishCost,
          });
        }

        for (let index = 0; index < quantity; index++) {
          dishIds.push(matchedDish.id);
        }
      });

      if (errors.length > 0) {
        allErrors.push(...errors);
        return;
      }

      if (dishIds.length === 0) {
        allErrors.push({
          type: 'INVALID_DATA',
          mealName,
          message: '套餐没有有效的菜品',
        });
        return;
      }

      allWarnings.push(...warnings);
      meals.push({
        name: mealName,
        dishIds,
        standardPrice,
        promoPrice1,
        promoPrice2,
      });
    });

    return {
      success: allErrors.length === 0,
      meals,
      errors: allErrors,
      warnings: allWarnings,
    };
  } catch (error) {
    return {
      success: false,
      meals: [],
      errors: [
        {
          type: 'INVALID_DATA',
          message: `文件解析错误: ${error instanceof Error ? error.message : '未知错误'}`,
        },
      ],
      warnings: [],
    };
  }
};

export const importDishesFromExcel = async (
  file: File,
  existingDishes: ExcelDish[] = []
): Promise<ParsedDishImportResult> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    if (workbook.SheetNames.length === 0) {
      return {
        success: false,
        dishes: [],
        duplicates: [],
        errors: ['Excel 文件中没有工作表'],
      };
    }

    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData: unknown[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (rawData.length === 0) {
      return {
        success: false,
        dishes: [],
        duplicates: [],
        errors: ['工作表中没有数据'],
      };
    }

    const existingDishMap = new Map<string, ExcelDish>();
    existingDishes.forEach((dish) => {
      existingDishMap.set(dish.name.trim(), dish);
    });

    const dishes: ExcelDish[] = [];
    const duplicates: ParsedDishImportResult['duplicates'] = [];
    const errors: string[] = [];

    for (let rowIdx = 1; rowIdx < rawData.length; rowIdx++) {
      const row = rawData[rowIdx];
      const [name, price, cost] = row;

      if (!name || String(name).trim() === '') {
        continue;
      }

      if (price === undefined || cost === undefined) {
        errors.push(`第 ${rowIdx + 1} 行: 菜品 "${String(name)}" 缺少售价或成本`);
        continue;
      }

      const normalizedName = String(name).trim();
      const dishData: Omit<ExcelDish, 'id'> = {
        name: normalizedName,
        price: Number(price) || 0,
        cost: Number(cost) || 0,
      };

      const existing = existingDishMap.get(normalizedName);

      if (existing) {
        duplicates.push({
          name: normalizedName,
          existing,
          new: dishData,
        });
      } else {
        const dish: ExcelDish = {
          id: `${Date.now()}_${rowIdx}_${Math.random().toString(36).slice(2, 8)}`,
          ...dishData,
        };
        dishes.push(dish);
        existingDishMap.set(normalizedName, dish);
      }
    }

    return {
      success: errors.length === 0 || dishes.length > 0,
      dishes,
      duplicates,
      errors,
    };
  } catch (error) {
    return {
      success: false,
      dishes: [],
      duplicates: [],
      errors: [`文件解析错误: ${error instanceof Error ? error.message : '未知错误'}`],
    };
  }
};

export const exportMealTemplate = () => {
  const template = [
    {
      套餐名称: '超值双人餐',
      菜品名称: '撒娇辣子鸡',
      菜品单价: '¥68.00',
      菜品成本: '¥25.00',
      数量: 1,
      菜品小计: '¥68.00',
      套餐原价: '¥128.00',
      秒杀价1: '¥99.00',
      秒杀毛利率1: '23.44%',
      秒杀价2: '¥88.00',
      秒杀毛利率2: '33.75%',
    },
    {
      套餐名称: '超值双人餐',
      菜品名称: '小炒黄牛肉',
      菜品单价: '¥58.00',
      菜品成本: '¥22.00',
      数量: 1,
      菜品小计: '¥58.00',
      套餐原价: '¥128.00',
      秒杀价1: '¥99.00',
      秒杀毛利率1: '23.44%',
      秒杀价2: '¥88.00',
      秒杀毛利率2: '33.75%',
    },
    {
      套餐名称: '超值双人餐',
      菜品名称: '有机花菜',
      菜品单价: '¥28.00',
      菜品成本: '¥8.00',
      数量: 1,
      菜品小计: '¥28.00',
      套餐原价: '¥128.00',
      秒杀价1: '¥99.00',
      秒杀毛利率1: '23.44%',
      秒杀价2: '¥88.00',
      秒杀毛利率2: '33.75%',
    },
    {
      套餐名称: '超值双人餐',
      菜品名称: '泉水玉米饭',
      菜品单价: '¥6.00',
      菜品成本: '¥2.00',
      数量: 2,
      菜品小计: '¥12.00',
      套餐原价: '¥128.00',
      秒杀价1: '¥99.00',
      秒杀毛利率1: '23.44%',
      秒杀价2: '¥88.00',
      秒杀毛利率2: '33.75%',
    },
    {
      套餐名称: '家庭套餐',
      菜品名称: '手打鱼丸',
      菜品单价: '¥48.00',
      菜品成本: '¥18.00',
      数量: 1,
      菜品小计: '¥48.00',
      套餐原价: '¥168.00',
      秒杀价1: '¥138.00',
      秒杀毛利率1: '28.48%',
      秒杀价2: '',
      秒杀毛利率2: '',
    },
    {
      套餐名称: '家庭套餐',
      菜品名称: '外婆红烧肉',
      菜品单价: '¥68.00',
      菜品成本: '¥25.00',
      数量: 1,
      菜品小计: '¥68.00',
      套餐原价: '¥168.00',
      秒杀价1: '¥138.00',
      秒杀毛利率1: '28.48%',
      秒杀价2: '',
      秒杀毛利率2: '',
    },
    {
      套餐名称: '家庭套餐',
      菜品名称: '蒜蓉油麦菜',
      菜品单价: '¥22.00',
      菜品成本: '¥6.00',
      数量: 1,
      菜品小计: '¥22.00',
      套餐原价: '¥168.00',
      秒杀价1: '¥138.00',
      秒杀毛利率1: '28.48%',
      秒杀价2: '',
      秒杀毛利率2: '',
    },
    {
      套餐名称: '家庭套餐',
      菜品名称: '泉水玉米饭',
      菜品单价: '¥6.00',
      菜品成本: '¥2.00',
      数量: 2,
      菜品小计: '¥12.00',
      套餐原价: '¥168.00',
      秒杀价1: '¥138.00',
      秒杀毛利率1: '28.48%',
      秒杀价2: '',
      秒杀毛利率2: '',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(template);
  worksheet['!cols'] = [
    { wch: 20 },
    { wch: 25 },
    { wch: 12 },
    { wch: 12 },
    { wch: 8 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '套餐导入模板');
  XLSX.writeFile(workbook, '套餐导入模板.xlsx');
};

export const exportDishLibrary = (
  dishes: Array<{
    name: string;
    cost: number;
    price?: number;
    categoryName?: string;
  }>
) => {
  const sorted = [...dishes].sort((a, b) => {
    const catA = a.categoryName?.trim() || '其他';
    const catB = b.categoryName?.trim() || '其他';
    if (catA !== catB) return catA.localeCompare(catB, 'zh-CN');
    return a.name.localeCompare(b.name, 'zh-CN');
  });

  const rows = sorted.map((dish, index) => ({
    序号: index + 1,
    菜品名称: dish.name,
    分类: dish.categoryName?.trim() || '其他',
    售价: dish.price ?? 0,
    成本: dish.cost,
    毛利率: dish.price ? ((dish.price - dish.cost) / dish.price * 100) : '-',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // 为售价和成本列设置数字格式
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  for (let row = range.s.r + 1; row <= range.e.r; row++) {
    // 售价列 (D, col=3)
    const priceCell = worksheet[XLSX.utils.encode_cell({ r: row, c: 3 })];
    if (priceCell && typeof priceCell.v === 'number') {
      priceCell.z = '"¥"#,##0.00';
    }
    // 成本列 (E, col=4)
    const costCell = worksheet[XLSX.utils.encode_cell({ r: row, c: 4 })];
    if (costCell && typeof costCell.v === 'number') {
      costCell.z = '"¥"#,##0.00';
    }
    // 毛利率列 (F, col=5) - 数字值添加百分比格式
    const marginCell = worksheet[XLSX.utils.encode_cell({ r: row, c: 5 })];
    if (marginCell && typeof marginCell.v === 'number') {
      marginCell.z = '0.00"%"';
    }
  }

  worksheet['!cols'] = [
    { wch: 8 },   // 序号
    { wch: 25 },  // 菜品名称
    { wch: 12 },  // 分类
    { wch: 12 },  // 售价
    { wch: 12 },  // 成本
    { wch: 12 },  // 毛利率
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '菜品库明细');

  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const time = now.toTimeString().split(' ')[0].replace(/:/g, '-');
  XLSX.writeFile(workbook, `菜品库_${date}_${time}.xlsx`);
};
