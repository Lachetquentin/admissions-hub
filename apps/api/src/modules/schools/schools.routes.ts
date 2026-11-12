import { Router } from 'express';
import { parseId } from '../../lib/params';
import { scopeOf } from '../../middleware/auth';
import { getSchool, listSchools } from './schools.service';

export const schoolsRouter = Router();

schoolsRouter.get('/', async (req, res) => {
  res.json(await listSchools(scopeOf(req)));
});

schoolsRouter.get('/:id', async (req, res) => {
  res.json(await getSchool(scopeOf(req), parseId(req.params.id, 'School')));
});
