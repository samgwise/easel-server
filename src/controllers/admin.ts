import type {MojoContext} from '@mojojs/core';

export default class Controller {
  // UoS paths
  async listUnitsOfStudy (ctx: MojoContext): Promise<void> {
    // ctx.stash.uos = ctx.models.
    await ctx.render();
  }
}
