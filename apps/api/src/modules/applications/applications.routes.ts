import { Router } from 'express';
import {
  applicationInputSchema,
  applicationListQuerySchema,
  applicationUpdateSchema,
} from '@admissions-hub/shared';
import { parseId } from '../../lib/params';
import { scopeOf } from '../../middleware/auth';
import {
  createApplication,
  deleteApplication,
  getApplication,
  listApplications,
  updateApplication,
} from './applications.service';

const applicationId = (raw: unknown) => parseId(raw, 'Application');

export const applicationsRouter = Router();

applicationsRouter.get('/', async (req, res) => {
  res.json(await listApplications(scopeOf(req), applicationListQuerySchema.parse(req.query)));
});

applicationsRouter.get('/:id', async (req, res) => {
  res.json(await getApplication(scopeOf(req), applicationId(req.params.id)));
});

applicationsRouter.post('/', async (req, res) => {
  const created = await createApplication(scopeOf(req), applicationInputSchema.parse(req.body));
  res.status(201).location(`/api/applications/${created.id}`).json(created);
});

applicationsRouter.patch('/:id', async (req, res) => {
  const id = applicationId(req.params.id);
  res.json(await updateApplication(scopeOf(req), id, applicationUpdateSchema.parse(req.body)));
});

applicationsRouter.delete('/:id', async (req, res) => {
  await deleteApplication(scopeOf(req), applicationId(req.params.id));
  res.status(204).end();
});
