import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { APIResponseBuilder } from './response';

type ValidationSchema = Record<string, any>;

export async function validateRequest<T extends ValidationSchema>(
  req: NextRequest,
  schema: T
): Promise<
  { success: true; data: z.infer<z.ZodObject<T>> } | 
  { success: false; response: NextResponse }
> {
  try {
    const body = await req.json();
    
    // Convert schema definition to Zod schema
    const zodSchema = z.object(
      Object.entries(schema).reduce((acc, [key, type]) => {
        if (Array.isArray(type)) {
          // Handle array type (e.g., ['string', 'string'] for exactly 2 strings)
          acc[key] = z.array(z.string()).length(type.length);
        } else if (typeof type === 'string') {
          // Handle optional fields (ending with ?)
          const isOptional = type.endsWith('?');
          const baseType = isOptional ? type.slice(0, -1) : type;
          
          let fieldSchema: z.ZodType<any>;
          switch (baseType) {
            case 'string':
              fieldSchema = z.string();
              break;
            case 'number':
              fieldSchema = z.number();
              break;
            case 'boolean':
              fieldSchema = z.boolean();
              break;
            case 'array':
              fieldSchema = z.array(z.any());
              break;
            default:
              fieldSchema = z.any();
          }
          
          acc[key] = isOptional ? fieldSchema.optional() : fieldSchema;
        }
        return acc;
      }, {} as Record<string, z.ZodType<any>>)
    );

    const validatedData = zodSchema.parse(body);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        response: APIResponseBuilder.error({
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: error.errors,
          status: 400
        })
      };
    }
    
    return {
      success: false,
      response: APIResponseBuilder.error({
        code: 'PARSE_ERROR',
        message: 'Failed to parse request body',
        status: 400
      })
    };
  }
} 