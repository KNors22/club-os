import { Router } from "express";
import { requireAuth } from "../services/auth.js";
import {
  createOrganization,
  getOrganizationAccess,
  joinOrganization,
  listOrganizations,
  publicOrganization,
} from "../services/organizations.js";
import {
  joinSchema,
  organizationSchema,
} from "../validation.js";

export const organizationRouter = Router();
organizationRouter.use(requireAuth);
organizationRouter.get("/", async (req, res) =>
  res.json({ organizations: await listOrganizations(req.session.userId!) }),
);
organizationRouter.post("/", async (req, res) => {
  const organization = await createOrganization(
    req.session.userId!,
    organizationSchema.parse(req.body),
  );
  res.status(201).json({ organization });
});
organizationRouter.post("/join", async (req, res) => {
  const { joinCode } = joinSchema.parse(req.body);
  res
    .status(201)
    .json({
      organization: await joinOrganization(req.session.userId!, joinCode),
    });
});
organizationRouter.get("/:orgId", async (req, res) => {
  const { organization } = await getOrganizationAccess(
    req.session.userId!,
    req.params.orgId,
  );
  res.json({
    organization: publicOrganization(organization, req.session.userId!),
  });
});
