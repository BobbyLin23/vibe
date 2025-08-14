import { serve } from 'inngest/nuxt'
import { codeAgentFunction, inngest } from '../inngest'

export default defineEventHandler(serve({ client: inngest, functions: [codeAgentFunction] }))
