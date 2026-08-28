import { Request, Response, NextFunction } from 'express';
import * as tagService from './tag.service.js';
import { createTagSchema, updateTagSchema } from '@furniture-os/shared';

export async function getTags(req: Request, res: Response, next: NextFunction) {
  try {
    const type = req.query.type as any;
    const tags = await tagService.getTags(req.tenantId!, type);
    res.json({
      success: true,
      data: tags,
    });
  } catch (error) {
    next(error);
  }
}

export async function createTag(req: Request, res: Response, next: NextFunction) {
  try {
    const body = createTagSchema.parse(req.body);
    const tag = await tagService.createTag(
      req.tenantId!,
      req.user?.id,
      body.name,
      body.type
    );
    res.status(201).json({
      success: true,
      data: tag,
      message: 'Tag created',
    });
  } catch (error) {
    next(error);
  }
}

export async function updateTag(req: Request, res: Response, next: NextFunction) {
  try {
    const body = updateTagSchema.parse(req.body);
    const tag = await tagService.updateTag(
      req.tenantId!,
      req.user?.id,
      req.params.id,
      body
    );
    res.json({
      success: true,
      data: tag,
      message: 'Tag updated',
    });
  } catch (error) {
    next(error);
  }
}

export async function deactivateTag(req: Request, res: Response, next: NextFunction) {
  try {
    const tag = await tagService.deactivateTag(
      req.tenantId!,
      req.user?.id,
      req.params.id
    );
    res.json({
      success: true,
      data: tag,
      message: 'Tag deactivated',
    });
  } catch (error) {
    next(error);
  }
}
